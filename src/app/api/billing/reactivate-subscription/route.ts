import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/billing/reactivate-subscription
 * Reactivates a subscription that was set to cancel at period end
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current subscription
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('stripe_subscription_id, cancel_at_period_end')
            .eq('user_id', user.id)
            .single();

        if (subError || !subscription) {
            return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
        }

        if (!subscription.stripe_subscription_id) {
            return NextResponse.json({ error: 'No active Stripe subscription' }, { status: 400 });
        }

        if (!subscription.cancel_at_period_end) {
            return NextResponse.json({ error: 'Subscription is not set to cancel' }, { status: 400 });
        }

        const stripe = getStripe();

        // Reactivate the subscription by setting cancel_at_period_end to false
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: false,
        });

        // Update our database
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                cancel_at_period_end: false,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

        if (updateError) {
            console.error('Error updating subscription in database:', updateError);
            // Don't fail - Stripe was updated successfully
        }

        return NextResponse.json({
            success: true,
            message: 'Your subscription has been reactivated and will continue normally.',
        });
    } catch (error) {
        console.error('Reactivate subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to reactivate subscription', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
