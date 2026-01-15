import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/billing/sync-subscription
 * Syncs the local subscription status with Stripe
 * This ensures our database matches Stripe's actual state
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current subscription from our database
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('stripe_subscription_id, stripe_customer_id, plan')
            .eq('user_id', user.id)
            .single();

        if (subError) {
            console.error('Error fetching subscription:', subError);
            return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
        }

        // If no Stripe subscription ID, nothing to sync
        if (!subscription?.stripe_subscription_id) {
            return NextResponse.json({
                success: true,
                synced: false,
                message: 'No Stripe subscription to sync',
                subscription: {
                    plan: subscription?.plan || 'free',
                    status: 'active',
                    cancel_at_period_end: false,
                }
            });
        }

        const stripe = getStripe();

        try {
            // Fetch the actual subscription from Stripe
            const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);

            // Determine plan from price ID
            let plan: 'free' | 'pro' | 'agency' = 'free';
            const priceId = stripeSubscription.items.data[0]?.price.id;
            if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
                plan = 'pro';
            } else if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) {
                plan = 'agency';
            }

            // Determine status
            let status = 'active';
            if (stripeSubscription.status === 'past_due') {
                status = 'past_due';
            } else if (stripeSubscription.status === 'canceled' || stripeSubscription.status === 'unpaid') {
                status = 'cancelled';
            }

            // Get period end
            const subData = stripeSubscription as unknown as { current_period_end?: number };
            const currentPeriodEnd = subData.current_period_end
                ? new Date(subData.current_period_end * 1000).toISOString()
                : null;

            // Update our database
            const { error: updateError } = await supabase
                .from('subscriptions')
                .update({
                    plan,
                    status,
                    cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                    current_period_end: currentPeriodEnd,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);

            if (updateError) {
                console.error('Error updating subscription:', updateError);
            }

            return NextResponse.json({
                success: true,
                synced: true,
                subscription: {
                    plan,
                    status,
                    cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                    current_period_end: currentPeriodEnd,
                    stripe_subscription_id: subscription.stripe_subscription_id,
                    stripe_customer_id: subscription.stripe_customer_id,
                }
            });
        } catch (stripeErr: unknown) {
            // If subscription not found in Stripe, it was deleted
            const error = stripeErr as { code?: string };
            if (error.code === 'resource_missing') {
                // Subscription was deleted in Stripe - downgrade to free
                await supabase
                    .from('subscriptions')
                    .update({
                        plan: 'free',
                        status: 'active',
                        stripe_subscription_id: null,
                        cancel_at_period_end: false,
                        current_period_start: null,
                        current_period_end: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', user.id);

                return NextResponse.json({
                    success: true,
                    synced: true,
                    subscription: {
                        plan: 'free',
                        status: 'active',
                        cancel_at_period_end: false,
                    },
                    message: 'Subscription was cancelled in Stripe. Downgraded to free plan.'
                });
            }

            console.error('Stripe error:', stripeErr);
            return NextResponse.json({
                error: 'Failed to fetch subscription from Stripe',
                details: stripeErr instanceof Error ? stripeErr.message : 'Unknown error'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Sync subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to sync subscription', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
