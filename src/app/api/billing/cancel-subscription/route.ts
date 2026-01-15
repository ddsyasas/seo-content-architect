import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/config';

/**
 * POST /api/billing/cancel-subscription
 * Cancels the user's Stripe subscription and downgrades to free plan
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get subscription details
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('stripe_subscription_id, plan')
            .eq('user_id', user.id)
            .single();

        if (!subscription || subscription.plan === 'free') {
            return NextResponse.json({ error: 'No active subscription to cancel' }, { status: 400 });
        }

        // Cancel in Stripe if we have a subscription ID
        if (subscription.stripe_subscription_id) {
            try {
                const stripe = getStripe();
                await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
            } catch (stripeErr) {
                console.error('Stripe cancellation error:', stripeErr);
                // Continue anyway - might be a test subscription without Stripe
            }
        }

        // Update database to free plan
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                plan: 'free',
                status: 'active',
                stripe_subscription_id: null,
                cancel_at_period_end: false,
            })
            .eq('user_id', user.id);

        if (updateError) {
            console.error('Database update error:', updateError);
            return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Subscription cancelled. You are now on the Free plan.'
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to cancel subscription' },
            { status: 500 }
        );
    }
}
