import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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
        const subscription = await prisma.subscriptions.findUnique({
            where: { user_id: user.id },
            select: { stripe_subscription_id: true, stripe_customer_id: true, plan: true },
        });

        // If we have a customer ID, check for and clean up duplicate subscriptions
        if (subscription?.stripe_customer_id) {
            const stripe = getStripe();

            try {
                // List ALL subscriptions for this customer
                const subscriptions = await stripe.subscriptions.list({
                    customer: subscription.stripe_customer_id,
                    status: 'active',
                });

                console.log(`[Sync] Found ${subscriptions.data.length} active subscriptions for customer ${subscription.stripe_customer_id}`);

                if (subscriptions.data.length > 1) {
                    // Keep the highest tier subscription, cancel the rest
                    const planPriority = { 'agency': 3, 'pro': 2, 'free': 1 };

                    const sortedSubs = subscriptions.data.sort((a, b) => {
                        const aPriceId = a.items.data[0]?.price.id;
                        const bPriceId = b.items.data[0]?.price.id;

                        const aPlan = aPriceId === process.env.STRIPE_AGENCY_PRICE_ID ? 'agency'
                            : aPriceId === process.env.STRIPE_PRO_PRICE_ID ? 'pro' : 'free';
                        const bPlan = bPriceId === process.env.STRIPE_AGENCY_PRICE_ID ? 'agency'
                            : bPriceId === process.env.STRIPE_PRO_PRICE_ID ? 'pro' : 'free';

                        // Sort by plan priority (highest first), then by creation date (newest first)
                        if (planPriority[aPlan] !== planPriority[bPlan]) {
                            return planPriority[bPlan] - planPriority[aPlan];
                        }
                        return (b.created || 0) - (a.created || 0);
                    });

                    // Keep the first one (highest priority), cancel the rest
                    const keepSub = sortedSubs[0];
                    for (let i = 1; i < sortedSubs.length; i++) {
                        console.log(`[Sync] Cancelling duplicate subscription: ${sortedSubs[i].id}`);
                        try {
                            await stripe.subscriptions.cancel(sortedSubs[i].id);
                        } catch (cancelErr) {
                            console.error(`[Sync] Failed to cancel subscription ${sortedSubs[i].id}:`, cancelErr);
                        }
                    }

                    // Use the kept subscription
                    const stripeSubscription = keepSub;

                    // Determine plan from price ID
                    let plan: 'free' | 'pro' | 'agency' = 'free';
                    const priceId = stripeSubscription.items.data[0]?.price.id;
                    if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
                        plan = 'pro';
                    } else if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) {
                        plan = 'agency';
                    }

                    // Get period end
                    const subData = stripeSubscription as unknown as { current_period_end?: number };
                    const currentPeriodEnd = subData.current_period_end
                        ? new Date(subData.current_period_end * 1000)
                        : null;

                    // Save the subscription ID we found
                    await prisma.subscriptions.update({
                        where: { user_id: user.id },
                        data: {
                            stripe_subscription_id: stripeSubscription.id,
                            plan,
                            status: 'active',
                            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                            current_period_end: currentPeriodEnd,
                            updated_at: new Date(),
                        },
                    });

                    console.log(`[Sync] Cleaned up duplicates, keeping subscription ${stripeSubscription.id} (${plan})`);

                    return NextResponse.json({
                        success: true,
                        synced: true,
                        cleanedUpDuplicates: true,
                        subscription: {
                            plan,
                            status: 'active',
                            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                            current_period_end: currentPeriodEnd?.toISOString(),
                            stripe_subscription_id: stripeSubscription.id,
                            stripe_customer_id: subscription.stripe_customer_id,
                        }
                    });
                } else if (subscriptions.data.length === 1) {
                    // Only one subscription, use it
                    const stripeSubscription = subscriptions.data[0];

                    // Determine plan from price ID
                    let plan: 'free' | 'pro' | 'agency' = 'free';
                    const priceId = stripeSubscription.items.data[0]?.price.id;
                    if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
                        plan = 'pro';
                    } else if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) {
                        plan = 'agency';
                    }

                    // Get period end
                    const subData = stripeSubscription as unknown as { current_period_end?: number };
                    const currentPeriodEnd = subData.current_period_end
                        ? new Date(subData.current_period_end * 1000)
                        : null;

                    // Save/update the subscription ID
                    await prisma.subscriptions.update({
                        where: { user_id: user.id },
                        data: {
                            stripe_subscription_id: stripeSubscription.id,
                            plan,
                            status: 'active',
                            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                            current_period_end: currentPeriodEnd,
                            updated_at: new Date(),
                        },
                    });

                    console.log(`[Sync] Synced subscription ${stripeSubscription.id} (${plan})`);

                    return NextResponse.json({
                        success: true,
                        synced: true,
                        subscription: {
                            plan,
                            status: 'active',
                            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                            current_period_end: currentPeriodEnd?.toISOString(),
                            stripe_subscription_id: stripeSubscription.id,
                            stripe_customer_id: subscription.stripe_customer_id,
                        }
                    });
                }
            } catch (lookupErr) {
                console.error('[Sync] Error looking up subscription:', lookupErr);
            }
        }

        // If no Stripe subscription ID and couldn't find one, nothing to sync
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
                ? new Date(subData.current_period_end * 1000)
                : null;

            // Update our database
            await prisma.subscriptions.update({
                where: { user_id: user.id },
                data: {
                    plan,
                    status,
                    cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                    current_period_end: currentPeriodEnd,
                    updated_at: new Date(),
                },
            });

            return NextResponse.json({
                success: true,
                synced: true,
                subscription: {
                    plan,
                    status,
                    cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                    current_period_end: currentPeriodEnd?.toISOString(),
                    stripe_subscription_id: subscription.stripe_subscription_id,
                    stripe_customer_id: subscription.stripe_customer_id,
                }
            });
        } catch (stripeErr: unknown) {
            // If subscription not found in Stripe, it was deleted
            const error = stripeErr as { code?: string };
            if (error.code === 'resource_missing') {
                // Subscription was deleted in Stripe - downgrade to free
                await prisma.subscriptions.update({
                    where: { user_id: user.id },
                    data: {
                        plan: 'free',
                        status: 'active',
                        stripe_subscription_id: null,
                        cancel_at_period_end: false,
                        current_period_start: null,
                        current_period_end: null,
                        updated_at: new Date(),
                    },
                });

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
