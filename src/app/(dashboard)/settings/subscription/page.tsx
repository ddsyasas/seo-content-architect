import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getPlanLimits, PlanType } from '@/lib/stripe/config';
import {
    SubscriptionPageContent,
    type SubscriptionPageData,
    type SubscriptionData,
    type UsageData,
} from './subscription-content';

// DEV MODE FLAG - Set to false to test real Stripe flow
const DEV_MODE = process.env.ENABLE_DEV_MODE === 'true';

/**
 * Server Component: Subscription settings page
 * Fetches subscription and usage data server-side using Prisma
 */
export default async function SubscriptionSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch subscription data
    const subscriptionRecord = await prisma.subscriptions.findUnique({
        where: { user_id: user.id },
        select: {
            plan: true,
            status: true,
            current_period_end: true,
            cancel_at_period_end: true,
            stripe_subscription_id: true,
        },
    });

    const subscription: SubscriptionData = subscriptionRecord
        ? {
            plan: (subscriptionRecord.plan || 'free') as PlanType,
            status: subscriptionRecord.status || 'active',
            current_period_end: subscriptionRecord.current_period_end?.toISOString() || null,
            cancel_at_period_end: subscriptionRecord.cancel_at_period_end || false,
            stripe_subscription_id: subscriptionRecord.stripe_subscription_id || null,
        }
        : {
            plan: 'free',
            status: 'active',
            current_period_end: null,
            cancel_at_period_end: false,
            stripe_subscription_id: null,
        };

    const planLimits = getPlanLimits(subscription.plan);

    // Fetch usage counts
    const [projectCount, articlesCount, nodesCount, teamMembersCount] = await Promise.all([
        prisma.projects.count({ where: { user_id: user.id } }),
        prisma.articles.count({
            where: {
                projects: { user_id: user.id },
            },
        }),
        prisma.nodes.count({
            where: {
                projects: { user_id: user.id },
            },
        }),
        prisma.team_members.count({
            where: {
                projects: { user_id: user.id },
            },
        }),
    ]);

    const usage: UsageData = {
        projects: {
            current: projectCount,
            limit: planLimits.projects,
        },
        totalArticles: articlesCount,
        totalNodes: nodesCount,
        totalTeamMembers: teamMembersCount,
    };

    const pageData: SubscriptionPageData = {
        subscription,
        usage,
        devMode: DEV_MODE,
    };

    return <SubscriptionPageContent initialData={pageData} />;
}
