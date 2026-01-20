import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's Stripe customer ID
        const profile = await prisma.profiles.findUnique({
            where: { id: user.id },
            select: { stripe_customer_id: true },
        });

        if (!profile) {
            console.error('Profile not found for user:', user.id);
            return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
        }

        if (!profile.stripe_customer_id) {
            return NextResponse.json(
                { error: 'No billing account found. Please upgrade to a paid plan first.' },
                { status: 400 }
            );
        }

        // Create portal session
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const stripe = getStripe();

        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: `${appUrl}/settings/billing`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Portal session error:', error);
        return NextResponse.json(
            { error: 'Failed to create portal session', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
