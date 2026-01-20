import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { isSuperAdminServer } from '@/lib/utils/admin';
import { AdminPageContent, type AdminPageData, type UserData, type Stats } from './admin-content';

/**
 * Server Component: Admin dashboard page
 * Fetches all users and stats server-side using Prisma
 * Requires super admin access
 */
export default async function AdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check authorization
    if (!user || !isSuperAdminServer(user.email)) {
        redirect('/dashboard');
    }

    // Get all profiles with their data
    const profiles = await prisma.profiles.findMany({
        orderBy: { created_at: 'desc' },
    });

    // Get project counts per user
    const projectCounts = await prisma.projects.findMany({
        select: { user_id: true },
    });

    // Get subscription data
    const subscriptions = await prisma.subscriptions.findMany({
        select: { user_id: true, plan: true, status: true, current_period_end: true },
    });

    // Aggregate data
    const projectCountMap: Record<string, number> = {};
    projectCounts.forEach(p => {
        projectCountMap[p.user_id] = (projectCountMap[p.user_id] || 0) + 1;
    });

    const subscriptionMap: Record<string, { plan: string; status: string; currentPeriodEnd?: string }> = {};
    subscriptions.forEach(s => {
        subscriptionMap[s.user_id] = {
            plan: s.plan || 'free',
            status: s.status || 'active',
            currentPeriodEnd: s.current_period_end?.toISOString(),
        };
    });

    // Combine data into users list
    const users: UserData[] = profiles.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        fullName: profile.full_name,
        createdAt: profile.created_at?.toISOString() || '',
        updatedAt: profile.updated_at?.toISOString() || '',
        projectCount: projectCountMap[profile.id] || 0,
        subscription: subscriptionMap[profile.id] || { plan: 'free', status: 'active' },
    }));

    // Calculate stats
    const stats: Stats = {
        totalUsers: users.length,
        totalProjects: Object.values(projectCountMap).reduce((a, b) => a + b, 0),
        subscriptionBreakdown: {
            free: users.filter(u => !u.subscription.plan || u.subscription.plan === 'free').length,
            pro: users.filter(u => u.subscription.plan === 'pro').length,
            agency: users.filter(u => u.subscription.plan === 'agency').length,
        },
    };

    const pageData: AdminPageData = {
        users,
        stats,
    };

    return <AdminPageContent initialData={pageData} />;
}
