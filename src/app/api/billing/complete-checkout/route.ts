import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PlanType } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/billing/complete-checkout
 * Called after Stripe checkout to ensure subscription data is saved
 * This is a fallback for when webhooks aren't configured (e.g., preview deployments)
 */
export async function POST(request: NextRequest) {
    console.log('[Complete Checkout] Starting...');

    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.log('[Complete Checkout] Unauthorized - no user');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log('[Complete Checkout] User:', user.id, user.email);

        const body = await request.json();
        const { sessionId } = body as { sessionId: string };
        console.log('[Complete Checkout] Session ID:', sessionId);

        if (!sessionId) {
            console.log('[Complete Checkout] No session ID provided');
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        const stripe = getStripe();

        // Retrieve the checkout session from Stripe
        console.log('[Complete Checkout] Retrieving session from Stripe...');
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription'],
        });

        if (!session) {
            console.log('[Complete Checkout] Session not found in Stripe');
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }
        console.log('[Complete Checkout] Session metadata:', session.metadata);
        console.log('[Complete Checkout] Session customer:', session.customer);
        console.log('[Complete Checkout] Session subscription:', session.subscription);

        // Verify this session belongs to this user
        if (session.metadata?.user_id !== user.id) {
            console.error('[Complete Checkout] Session user mismatch:', session.metadata?.user_id, 'vs', user.id);
            return NextResponse.json({ error: 'Session does not belong to this user' }, { status: 403 });
        }

        const customerId = session.customer as string;
        // session.subscription can be a string ID or an expanded object
        const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : (session.subscription as { id: string })?.id;
        const plan = session.metadata?.plan as PlanType;
        console.log('[Complete Checkout] Extracted: customer=%s, subscription=%s, plan=%s', customerId, subscriptionId, plan);

        if (!subscriptionId) {
            console.log('[Complete Checkout] No subscription ID in session');
            return NextResponse.json({ error: 'No subscription in session' }, { status: 400 });
        }

        // Get subscription details from Stripe (if we already have the expanded object, use it)
        const stripeSubscription = typeof session.subscription === 'object' && session.subscription
            ? session.subscription as { id: string; current_period_start?: number; current_period_end?: number }
            : await stripe.subscriptions.retrieve(subscriptionId);

        // Access current_period_start/end from the subscription
        const subData = stripeSubscription as { current_period_start?: number; current_period_end?: number };

        const currentPeriodStart = subData.current_period_start
            ? new Date(subData.current_period_start * 1000)
            : new Date();
        const currentPeriodEnd = subData.current_period_end
            ? new Date(subData.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        console.log('[Complete Checkout] Period: start=%s, end=%s', currentPeriodStart, currentPeriodEnd);

        // Update the subscription record with all Stripe data
        console.log('[Complete Checkout] Upserting subscription record...');
        const upsertResult = await prisma.subscriptions.upsert({
            where: { user_id: user.id },
            update: {
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                plan: plan || 'pro',
                status: 'active',
                current_period_start: currentPeriodStart,
                current_period_end: currentPeriodEnd,
                cancel_at_period_end: false,
                updated_at: new Date(),
            },
            create: {
                user_id: user.id,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                plan: plan || 'pro',
                status: 'active',
                current_period_start: currentPeriodStart,
                current_period_end: currentPeriodEnd,
                cancel_at_period_end: false,
            },
        });
        console.log('[Complete Checkout] Upsert result:', JSON.stringify(upsertResult));

        // Also update the profile with the customer ID if not set
        console.log('[Complete Checkout] Updating profile with customer ID...');
        await prisma.profiles.update({
            where: { id: user.id },
            data: { stripe_customer_id: customerId },
        });

        console.log(`[Complete Checkout] SUCCESS - Subscription saved for user ${user.id}: plan=${plan || 'pro'}, subscription=${subscriptionId}`);

        return NextResponse.json({
            success: true,
            subscription: {
                plan: plan || 'pro',
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: customerId,
                current_period_end: currentPeriodEnd.toISOString(),
            },
        });
    } catch (error) {
        console.error('Complete checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to complete checkout', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
