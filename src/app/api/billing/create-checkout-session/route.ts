import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLANS, PlanType } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { plan } = body as { plan: PlanType };

        // Validate plan
        if (!plan || !PLANS[plan] || plan === 'free') {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const planConfig = PLANS[plan];
        if (!planConfig.stripePriceId) {
            return NextResponse.json({ error: 'Plan not available for purchase' }, { status: 400 });
        }

        // Get or create Stripe customer
        let stripeCustomerId: string;

        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id, email, full_name')
            .eq('id', user.id)
            .single();

        if (profile?.stripe_customer_id) {
            stripeCustomerId = profile.stripe_customer_id;
        } else {
            // Create new Stripe customer
            const customer = await stripe.customers.create({
                email: user.email || profile?.email,
                name: profile?.full_name || undefined,
                metadata: {
                    user_id: user.id,
                },
            });
            stripeCustomerId = customer.id;

            // Save customer ID to profile
            await supabase
                .from('profiles')
                .update({ stripe_customer_id: customer.id })
                .eq('id', user.id);
        }

        // Create checkout session
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: planConfig.stripePriceId,
                    quantity: 1,
                },
            ],
            success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
            cancel_url: `${appUrl}/checkout/cancel`,
            subscription_data: {
                metadata: {
                    user_id: user.id,
                    plan: plan,
                },
            },
            metadata: {
                user_id: user.id,
                plan: plan,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Checkout session error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
