import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Create supabase admin client lazily to avoid build-time env access
function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaymentSucceeded(invoice);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaymentFailed(invoice);
                break;
            }

            default:
                console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[Stripe Webhook] Error processing event:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!userId || !plan) {
        console.error('[Webhook] Missing user_id or plan in session metadata');
        return;
    }

    console.log(`[Webhook] Checkout completed for user ${userId}, plan: ${plan}`);

    // Update or create subscription record
    const { error } = await getSupabaseAdmin()
        .from('subscriptions')
        .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan: plan,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
            cancel_at_period_end: false,
        }, { onConflict: 'user_id' });

    if (error) {
        console.error('[Webhook] Error updating subscription:', error);
    } else {
        console.log(`[Webhook] Subscription updated for user ${userId}`);
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Determine plan from price ID
    let plan = 'free';
    const priceId = subscription.items.data[0]?.price.id;
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
        plan = 'pro';
    } else if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) {
        plan = 'agency';
    }

    // Determine status
    let status = 'active';
    if (subscription.status === 'past_due') {
        status = 'past_due';
    } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
        status = 'cancelled';
    }

    const { error } = await getSupabaseAdmin()
        .from('subscriptions')
        .update({
            plan,
            status,
            cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq('stripe_customer_id', customerId);

    if (error) {
        console.error('[Webhook] Error updating subscription:', error);
    } else {
        console.log(`[Webhook] Subscription updated for customer ${customerId}`);
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    console.log(`[Webhook] Subscription deleted for customer ${customerId}`);

    // Downgrade to free plan
    const { error } = await getSupabaseAdmin()
        .from('subscriptions')
        .update({
            plan: 'free',
            status: 'active',
            stripe_subscription_id: null,
            current_period_start: null,
            current_period_end: null,
            cancel_at_period_end: false,
        })
        .eq('stripe_customer_id', customerId);

    if (error) {
        console.error('[Webhook] Error downgrading subscription:', error);
    } else {
        console.log(`[Webhook] User downgraded to free plan`);
    }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const { error } = await getSupabaseAdmin()
        .from('subscriptions')
        .update({
            status: 'active',
        })
        .eq('stripe_customer_id', customerId);

    if (error) {
        console.error('[Webhook] Error updating subscription after payment:', error);
    }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    console.log(`[Webhook] Payment failed for customer ${customerId}`);

    const { error } = await getSupabaseAdmin()
        .from('subscriptions')
        .update({
            status: 'past_due',
        })
        .eq('stripe_customer_id', customerId);

    if (error) {
        console.error('[Webhook] Error updating subscription status:', error);
    }
}
