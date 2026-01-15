import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PLANS, PlanType, getStripePriceId } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/billing/update-subscription
 * Updates an existing subscription to a new plan
 * - Upgrades: Immediate change with prorated billing
 * - Downgrades: Scheduled for end of billing period
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('Auth error:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { plan: targetPlan } = body as { plan: PlanType };

        // Validate target plan
        if (!targetPlan || !PLANS[targetPlan]) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        // Get current subscription
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('plan, stripe_subscription_id, stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        if (subError || !subscription) {
            console.error('Error fetching subscription:', subError);
            return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
        }

        const currentPlan = subscription.plan as PlanType;

        // If same plan, nothing to do
        if (currentPlan === targetPlan) {
            return NextResponse.json({ error: 'Already on this plan' }, { status: 400 });
        }

        // If no Stripe subscription (free user wanting to upgrade), redirect to checkout
        if (!subscription.stripe_subscription_id) {
            if (targetPlan === 'free') {
                return NextResponse.json({ error: 'Already on free plan' }, { status: 400 });
            }
            // No existing subscription - need to create new one via checkout
            return NextResponse.json({
                action: 'checkout_required',
                message: 'No existing subscription. Please use checkout.'
            }, { status: 200 });
        }

        const stripe = getStripe();

        // Determine if this is an upgrade or downgrade
        const planOrder = { free: 0, pro: 1, agency: 2 };
        const isUpgrade = planOrder[targetPlan] > planOrder[currentPlan];
        const isDowngradeToFree = targetPlan === 'free';

        if (isDowngradeToFree) {
            // Cancel subscription at period end (user keeps access until then)
            try {
                await stripe.subscriptions.update(subscription.stripe_subscription_id, {
                    cancel_at_period_end: true,
                });

                // Update our database to reflect pending cancellation
                await supabase
                    .from('subscriptions')
                    .update({ cancel_at_period_end: true })
                    .eq('user_id', user.id);

                return NextResponse.json({
                    success: true,
                    action: 'cancelled_at_period_end',
                    message: 'Your subscription will be cancelled at the end of the billing period. You\'ll keep access to paid features until then.'
                });
            } catch (stripeErr) {
                console.error('Stripe cancellation error:', stripeErr);
                return NextResponse.json({
                    error: 'Failed to cancel subscription',
                    details: stripeErr instanceof Error ? stripeErr.message : 'Unknown error'
                }, { status: 500 });
            }
        }

        // Get the new price ID
        const newPriceId = getStripePriceId(targetPlan);
        if (!newPriceId) {
            return NextResponse.json({ error: 'Target plan not available' }, { status: 400 });
        }

        try {
            // Get current subscription from Stripe to find the subscription item ID
            const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
            const subscriptionItemId = stripeSubscription.items.data[0]?.id;

            if (!subscriptionItemId) {
                console.error('No subscription item found');
                return NextResponse.json({ error: 'Invalid subscription state' }, { status: 500 });
            }

            if (isUpgrade) {
                // UPGRADE: Immediate change with prorated billing collected NOW
                // This charges the price difference immediately instead of adding to next invoice
                const updatedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
                    items: [{
                        id: subscriptionItemId,
                        price: newPriceId,
                    }],
                    proration_behavior: 'always_invoice', // Create an invoice immediately for the proration
                    payment_behavior: 'error_if_incomplete', // Fail if payment doesn't go through
                    cancel_at_period_end: false, // Ensure subscription continues
                });

                // The above creates a proration invoice - Stripe will automatically attempt to pay it
                // For extra reliability, retrieve and pay any open invoices
                try {
                    const invoices = await stripe.invoices.list({
                        subscription: subscription.stripe_subscription_id,
                        status: 'open',
                        limit: 1,
                    });

                    if (invoices.data.length > 0) {
                        // Pay the proration invoice immediately
                        await stripe.invoices.pay(invoices.data[0].id);
                    }
                } catch (invoiceErr) {
                    // If invoice payment fails, the subscription update still went through
                    // Stripe will retry the payment automatically
                    console.warn('Could not immediately pay proration invoice:', invoiceErr);
                }

                // Update our database immediately
                await supabase
                    .from('subscriptions')
                    .update({
                        plan: targetPlan,
                        cancel_at_period_end: false,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', user.id);

                return NextResponse.json({
                    success: true,
                    action: 'upgraded',
                    message: `Successfully upgraded to ${PLANS[targetPlan].name}! You've been charged the prorated difference. Your next billing will be the regular ${PLANS[targetPlan].name} price.`,
                    newPlan: targetPlan,
                });
            } else {
                // DOWNGRADE (paid to lower paid): Schedule for end of period
                // User keeps current plan benefits until period ends
                await stripe.subscriptions.update(subscription.stripe_subscription_id, {
                    items: [{
                        id: subscriptionItemId,
                        price: newPriceId,
                    }],
                    proration_behavior: 'none', // No proration - change at period end
                    billing_cycle_anchor: 'unchanged', // Keep same billing date
                });

                // Note: The webhook will update our database when the change takes effect
                // For now, we can optionally store the pending change
                await supabase
                    .from('subscriptions')
                    .update({
                        // Don't change plan yet - it's still active
                        // The webhook will update when Stripe processes the change
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', user.id);

                // Get the current period end from the original subscription
                // Cast to access the property (Stripe types can be restrictive)
                const subData = stripeSubscription as unknown as { current_period_end?: number };
                const periodEnd = subData.current_period_end
                    ? new Date(subData.current_period_end * 1000).toISOString()
                    : null;

                return NextResponse.json({
                    success: true,
                    action: 'downgrade_scheduled',
                    message: `Your plan will change to ${PLANS[targetPlan].name} at the end of your current billing period. You'll keep ${PLANS[currentPlan].name} features until then.`,
                    newPlan: targetPlan,
                    effectiveDate: periodEnd,
                });
            }
        } catch (stripeErr: unknown) {
            console.error('Stripe subscription update error:', stripeErr);

            // Check for specific Stripe error types
            const stripeError = stripeErr as { type?: string; code?: string; message?: string; decline_code?: string };

            // Handle payment failures specifically
            if (stripeError.type === 'StripeCardError' || stripeError.code === 'card_declined') {
                const declineCode = stripeError.decline_code || 'unknown';
                let userMessage = 'Your payment could not be processed.';

                switch (declineCode) {
                    case 'insufficient_funds':
                        userMessage = 'Your card has insufficient funds. Please use a different card or add funds.';
                        break;
                    case 'card_declined':
                    case 'generic_decline':
                        userMessage = 'Your card was declined. Please try a different payment method.';
                        break;
                    case 'expired_card':
                        userMessage = 'Your card has expired. Please update your payment method.';
                        break;
                    case 'incorrect_cvc':
                        userMessage = 'The CVC code is incorrect. Please check your card details.';
                        break;
                    case 'processing_error':
                        userMessage = 'There was a processing error. Please try again in a moment.';
                        break;
                    default:
                        userMessage = 'Your payment failed. Please check your card or try a different payment method.';
                }

                return NextResponse.json({
                    error: 'Payment failed',
                    details: userMessage,
                    code: 'payment_failed'
                }, { status: 402 }); // 402 Payment Required
            }

            // Handle incomplete payment (requires action like 3D Secure)
            if (stripeError.code === 'payment_intent_action_required' ||
                stripeError.code === 'subscription_payment_intent_requires_action') {
                return NextResponse.json({
                    error: 'Additional authentication required',
                    details: 'Your bank requires additional verification. Please update your payment method in Billing Settings.',
                    code: 'requires_action'
                }, { status: 402 });
            }

            return NextResponse.json({
                error: 'Failed to update subscription',
                details: stripeError.message || 'An unexpected error occurred. Please try again.'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Update subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to update subscription', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
