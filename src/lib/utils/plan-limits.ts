import { createClient } from '@/lib/supabase/client';
import { getPlanLimits, PlanType } from '@/lib/stripe/config';

export interface UsageInfo {
    current: number;
    limit: number;
    percentage: number;
    isAtLimit: boolean;
    isNearLimit: boolean; // 80% or more
}

export interface UserUsage {
    plan: PlanType;
    projects: UsageInfo;
}

export interface ProjectUsage {
    plan: PlanType;
    articles: UsageInfo;
    nodes: UsageInfo;
    teamMembers: UsageInfo;
}

// Calculate usage info
function calculateUsageInfo(current: number, limit: number): UsageInfo {
    const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
    return {
        current,
        limit,
        percentage,
        isAtLimit: current >= limit,
        isNearLimit: percentage >= 80,
    };
}

// Get user's subscription plan
export async function getUserPlan(userId: string): Promise<PlanType> {
    const supabase = createClient();

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .single();

    return (subscription?.plan as PlanType) || 'free';
}

// Get user's project usage
export async function getUserProjectUsage(userId: string): Promise<UserUsage> {
    const supabase = createClient();

    const [planResult, projectsResult] = await Promise.all([
        getUserPlan(userId),
        supabase
            .from('projects')
            .select('id', { count: 'exact' })
            .eq('user_id', userId),
    ]);

    const plan = planResult;
    const limits = getPlanLimits(plan);
    const projectCount = projectsResult.count || 0;

    return {
        plan,
        projects: calculateUsageInfo(projectCount, limits.projects),
    };
}

// Get project resource usage
export async function getProjectUsage(projectId: string, userId: string): Promise<ProjectUsage> {
    const supabase = createClient();

    const [planResult, articlesResult, nodesResult, teamResult] = await Promise.all([
        getUserPlan(userId),
        supabase
            .from('nodes')
            .select('id', { count: 'exact' })
            .eq('project_id', projectId)
            .neq('node_type', 'external'),
        supabase
            .from('nodes')
            .select('id', { count: 'exact' })
            .eq('project_id', projectId),
        supabase
            .from('team_members')
            .select('id', { count: 'exact' })
            .eq('project_id', projectId),
    ]);

    const plan = planResult;
    const limits = getPlanLimits(plan);

    return {
        plan,
        articles: calculateUsageInfo(articlesResult.count || 0, limits.articlesPerProject),
        nodes: calculateUsageInfo(nodesResult.count || 0, limits.nodesPerProject),
        teamMembers: calculateUsageInfo(teamResult.count || 0, limits.teamMembersPerProject),
    };
}

// Check if user can create a new project
export async function canCreateProject(userId: string): Promise<{ allowed: boolean; usage: UserUsage }> {
    const usage = await getUserProjectUsage(userId);
    return {
        allowed: !usage.projects.isAtLimit,
        usage,
    };
}

// Check if user can add an article to a project
export async function canCreateArticle(projectId: string, userId: string): Promise<{ allowed: boolean; usage: ProjectUsage }> {
    const usage = await getProjectUsage(projectId, userId);
    return {
        allowed: !usage.articles.isAtLimit,
        usage,
    };
}

// Check if user can add a node to a project
export async function canCreateNode(projectId: string, userId: string): Promise<{ allowed: boolean; usage: ProjectUsage }> {
    const usage = await getProjectUsage(projectId, userId);
    return {
        allowed: !usage.nodes.isAtLimit,
        usage,
    };
}

// Check if user can invite a team member
export async function canInviteTeamMember(projectId: string, userId: string): Promise<{ allowed: boolean; usage: ProjectUsage }> {
    const usage = await getProjectUsage(projectId, userId);
    return {
        allowed: !usage.teamMembers.isAtLimit,
        usage,
    };
}

// Get color for usage percentage
export function getUsageColor(percentage: number): string {
    if (percentage >= 100) return 'text-red-600 bg-red-100';
    if (percentage >= 80) return 'text-orange-600 bg-orange-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
}

// Get progress bar color
export function getProgressColor(percentage: number): string {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
}
