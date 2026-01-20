import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import {
    sendWelcomeSubscriptionEmail,
    sendSubscriptionCancelledEmail,
    sendPaymentFailedEmail,
} from '@/lib/email/brevo';

// Create supabase admin client lazily - only for auth.admin API calls
function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// Helper to get user email from customer ID
async function getUserEmailFromCustomerId(customerId: string): Promise<{ email: string; name?: string } | null> {
    // Get user_id from subscription
    const subscription = await prisma.subscriptions.findFirst({
        where: { stripe_customer_id: customerId },
        select: { user_id: true },
    });

    if (!subscription?.user_id) return null;

    // Get user profile
    const profile = await prisma.profiles.findUnique({
        where: { id: subscription.user_id },
        select: { email: true, full_name: true },
    });

    if (!profile?.email) {
        // Try auth.users as fallback (needs Supabase Admin)
        const supabase = getSupabaseAdmin();
        const { data: authUser } = await supabase.auth.admin.getUserById(subscription.user_id);
        return authUser?.user?.email ? { email: authUser.user.email } : null;
    }

    return { email: profile.email, name: profile.full_name || undefined };
}

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    const stripe = getStripe();

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
    const plan = session.metadata?.plan as 'pro' | 'agency';
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!userId || !plan) {
        console.error('[Webhook] Missing user_id or plan in session metadata');
        return;
    }

    console.log(`[Webhook] Checkout completed for user ${userId}, plan: ${plan}`);

    try {
        // Upsert subscription record
        await prisma.subscriptions.upsert({
            where: { user_id: userId },
            update: {
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                plan: plan,
                status: 'active',
                current_period_start: new Date(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
                cancel_at_period_end: false,
                updated_at: new Date(),
            },
            create: {
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                plan: plan,
                status: 'active',
                current_period_start: new Date(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                cancel_at_period_end: false,
            },
        });

        console.log(`[Webhook] Subscription updated for user ${userId}`);

        // Send welcome email
        const profile = await prisma.profiles.findUnique({
            where: { id: userId },
            select: { email: true, full_name: true },
        });

        if (profile?.email && (plan === 'pro' || plan === 'agency')) {
            try {
                await sendWelcomeSubscriptionEmail({
                    to: profile.email,
                    toName: profile.full_name || undefined,
                    plan,
                });
                console.log(`[Webhook] Welcome email sent to ${profile.email}`);
            } catch (emailErr) {
                console.error('[Webhook] Failed to send welcome email:', emailErr);
            }
        }
    } catch (error) {
        console.error('[Webhook] Error updating subscription:', error);
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

    // Access current_period_end from the subscription object
    const currentPeriodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end
        ? new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000)
        : null;

    try {
        await prisma.subscriptions.updateMany({
            where: { stripe_customer_id: customerId },
            data: {
                plan,
                status,
                cancel_at_period_end: subscription.cancel_at_period_end,
                current_period_end: currentPeriodEnd,
                updated_at: new Date(),
            },
        });
        console.log(`[Webhook] Subscription updated for customer ${customerId}`);
    } catch (error) {
        console.error('[Webhook] Error updating subscription:', error);
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    console.log(`[Webhook] Subscription deleted for customer ${customerId}`)

    // Get user info before updating
    const userInfo = await getUserEmailFromCustomerId(customerId);

    try {
        // Downgrade to free plan
        await prisma.subscriptions.updateMany({
            where: { stripe_customer_id: customerId },
            data: {
                plan: 'free',
                status: 'active',
                stripe_subscription_id: null,
                current_period_start: null,
                current_period_end: null,
                cancel_at_period_end: false,
                updated_at: new Date(),
            },
        });

        console.log(`[Webhook] User downgraded to free plan`);

        // Send cancellation email
        if (userInfo?.email) {
            try {
                const endDate = new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                });
                await sendSubscriptionCancelledEmail({
                    to: userInfo.email,
                    toName: userInfo.name,
                    endDate,
                });
                console.log(`[Webhook] Cancellation email sent to ${userInfo.email}`);
            } catch (emailErr) {
                console.error('[Webhook] Failed to send cancellation email:', emailErr);
            }
        }
    } catch (error) {
        console.error('[Webhook] Error downgrading subscription:', error);
    }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    try {
        await prisma.subscriptions.updateMany({
            where: { stripe_customer_id: customerId },
            data: {
                status: 'active',
                updated_at: new Date(),
            },
        });
    } catch (error) {
        console.error('[Webhook] Error updating subscription after payment:', error);
    }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    console.log(`[Webhook] Payment failed for customer ${customerId}`);

    try {
        await prisma.subscriptions.updateMany({
            where: { stripe_customer_id: customerId },
            data: {
                status: 'past_due',
                updated_at: new Date(),
            },
        });

        // Send payment failed email
        const userInfo = await getUserEmailFromCustomerId(customerId);

        if (userInfo?.email) {
            try {
                const retryDate = invoice.next_payment_attempt
                    ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                    })
                    : undefined;

                await sendPaymentFailedEmail({
                    to: userInfo.email,
                    toName: userInfo.name,
                    retryDate,
                });
                console.log(`[Webhook] Payment failed email sent to ${userInfo.email}`);
            } catch (emailErr) {
                console.error('[Webhook] Failed to send payment failed email:', emailErr);
            }
        }
    } catch (error) {
        console.error('[Webhook] Error updating subscription status:', error);
    }
}
