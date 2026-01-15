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
                // UPGRADE: Immediate change with proration
                // Stripe automatically calculates prorated amount
                const updatedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
                    items: [{
                        id: subscriptionItemId,
                        price: newPriceId,
                    }],
                    proration_behavior: 'create_prorations', // Charge/credit prorated amount
                    cancel_at_period_end: false, // Ensure subscription continues
                });

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
                    message: `Successfully upgraded to ${PLANS[targetPlan].name}! Your account has been updated immediately. Any unused time from your previous plan has been credited.`,
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
        } catch (stripeErr) {
            console.error('Stripe subscription update error:', stripeErr);
            return NextResponse.json({
                error: 'Failed to update subscription',
                details: stripeErr instanceof Error ? stripeErr.message : 'Unknown error'
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
