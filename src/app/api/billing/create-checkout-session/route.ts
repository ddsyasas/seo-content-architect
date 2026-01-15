import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PLANS, PlanType, getStripePriceId } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

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
        const { plan } = body as { plan: PlanType };

        // Validate plan
        if (!plan || !PLANS[plan] || plan === 'free') {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        // Get price ID at runtime
        const stripePriceId = getStripePriceId(plan);
        if (!stripePriceId) {
            console.error('Missing price ID for plan:', plan, 'Available env vars:', {
                pro: process.env.STRIPE_PRO_PRICE_ID ? 'set' : 'missing',
                agency: process.env.STRIPE_AGENCY_PRICE_ID ? 'set' : 'missing',
            });
            return NextResponse.json({ error: 'Plan not available for purchase' }, { status: 400 });
        }

        // Get or create Stripe customer
        let stripeCustomerId: string;

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('stripe_customer_id, email, full_name')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
        }

        // Get the Stripe instance
        const stripe = getStripe();

        if (profile?.stripe_customer_id) {
            stripeCustomerId = profile.stripe_customer_id;
        } else {
            // Create new Stripe customer
            try {
                const customer = await stripe.customers.create({
                    email: user.email || profile?.email,
                    name: profile?.full_name || undefined,
                    metadata: {
                        user_id: user.id,
                    },
                });
                stripeCustomerId = customer.id;

                // Save customer ID to profile
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ stripe_customer_id: customer.id })
                    .eq('id', user.id);

                if (updateError) {
                    console.error('Error saving customer ID to profile:', updateError);
                    // Continue anyway - customer was created in Stripe
                }
            } catch (stripeErr) {
                console.error('Stripe customer creation error:', stripeErr);
                return NextResponse.json({
                    error: 'Failed to create customer account',
                    details: stripeErr instanceof Error ? stripeErr.message : 'Unknown error'
                }, { status: 500 });
            }
        }

        // Create checkout session
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        try {
            const session = await stripe.checkout.sessions.create({
                customer: stripeCustomerId,
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: stripePriceId,
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
        } catch (stripeErr) {
            console.error('Stripe checkout session error:', stripeErr);
            return NextResponse.json({
                error: 'Failed to create checkout session',
                details: stripeErr instanceof Error ? stripeErr.message : 'Unknown error'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Checkout session error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
