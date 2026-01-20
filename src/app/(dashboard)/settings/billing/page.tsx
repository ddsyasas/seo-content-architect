import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { PlanType } from '@/lib/stripe/config';
import { BillingPageContent } from './billing-content';

export interface SubscriptionData {
    plan: PlanType;
    stripe_customer_id: string | null;
    cancel_at_period_end: boolean;
    current_period_end: string | null;
}

/**
 * Server Component: Fetches subscription data server-side using Prisma
 * Then passes to client component for interactivity
 */
export default async function BillingSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch subscription data using Prisma (bypasses RLS)
    const subscription = await prisma.subscriptions.findUnique({
        where: { user_id: user.id },
        select: {
            plan: true,
            cancel_at_period_end: true,
            current_period_end: true,
        },
    });

    // Fetch stripe_customer_id from profiles table (that's where checkout stores it)
    const profile = await prisma.profiles.findUnique({
        where: { id: user.id },
        select: { stripe_customer_id: true },
    });

    // Transform to expected format
    const subscriptionData: SubscriptionData | null = subscription ? {
        plan: subscription.plan as PlanType,
        stripe_customer_id: profile?.stripe_customer_id || null,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        current_period_end: subscription.current_period_end?.toISOString() || null,
    } : null;

    const isPaidUser = subscriptionData?.plan !== 'free' && subscriptionData?.plan !== undefined;

    return (
        <BillingPageContent
            subscription={subscriptionData}
            isPaidUser={isPaidUser}
        />
    );
}
