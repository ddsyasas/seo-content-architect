import { createAdminClient } from '@/lib/supabase/server';
import { getPlanLimits, planHasFeature } from '@/lib/stripe/config';

interface LimitCheckResult {
    allowed: boolean;
    current: number;
    limit: number;
    message?: string;
}

interface FeatureCheckResult {
    allowed: boolean;
    plan: string;
    message?: string;
}

/**
 * Get owner's plan for a project (handles both owners and team members)
 */
export async function getProjectOwnerPlan(projectId: string): Promise<string> {
    const adminSupabase = createAdminClient();

    // Get project owner
    const { data: project } = await adminSupabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single();

    if (!project) return 'free';

    // Get owner's subscription
    const { data: subscription } = await adminSupabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', project.user_id)
        .single();

    return subscription?.plan || 'free';
}

/**
 * Get user's plan
 */
export async function getUserPlan(userId: string): Promise<string> {
    const adminSupabase = createAdminClient();

    const { data: subscription } = await adminSupabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .single();

    return subscription?.plan || 'free';
}

/**
 * Check if user can create more projects
 */
export async function checkProjectLimit(userId: string): Promise<LimitCheckResult> {
    const adminSupabase = createAdminClient();

    const plan = await getUserPlan(userId);
    const limits = getPlanLimits(plan);

    // Count existing projects
    const { count, error } = await adminSupabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) {
        console.error('[checkProjectLimit] Error counting projects:', error);
    }

    const current = count || 0;
    const allowed = current < limits.projects;

    console.log(`[checkProjectLimit] User ${userId}: plan=${plan}, current=${current}, limit=${limits.projects}, allowed=${allowed}`);

    return {
        allowed,
        current,
        limit: limits.projects,
        message: allowed
            ? undefined
            : `You've reached your project limit (${limits.projects}). Upgrade your plan to create more projects.`,
    };
}

/**
 * Check if more articles can be added to a project
 */
export async function checkArticleLimit(projectId: string): Promise<LimitCheckResult> {
    const adminSupabase = createAdminClient();

    const plan = await getProjectOwnerPlan(projectId);
    const limits = getPlanLimits(plan);

    // Count existing articles
    const { count } = await adminSupabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId);

    const current = count || 0;
    const allowed = current < limits.articlesPerProject;

    return {
        allowed,
        current,
        limit: limits.articlesPerProject,
        message: allowed
            ? undefined
            : `Article limit reached (${limits.articlesPerProject}). Upgrade to add more articles.`,
    };
}

/**
 * Check if more nodes can be added to a project
 */
export async function checkNodeLimit(projectId: string): Promise<LimitCheckResult> {
    const adminSupabase = createAdminClient();

    const plan = await getProjectOwnerPlan(projectId);
    const limits = getPlanLimits(plan);

    // Count existing nodes
    const { count } = await adminSupabase
        .from('nodes')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId);

    const current = count || 0;
    const allowed = current < limits.nodesPerProject;

    return {
        allowed,
        current,
        limit: limits.nodesPerProject,
        message: allowed
            ? undefined
            : `Node limit reached (${limits.nodesPerProject}). Upgrade to add more nodes.`,
    };
}

/**
 * Check if more team members can be added
 */
export async function checkTeamLimit(ownerId: string): Promise<LimitCheckResult> {
    const adminSupabase = createAdminClient();

    const plan = await getUserPlan(ownerId);
    const limits = getPlanLimits(plan);

    // Get all owner's projects
    const { data: projects } = await adminSupabase
        .from('projects')
        .select('id')
        .eq('user_id', ownerId);

    const projectIds = projects?.map(p => p.id) || [];

    // Count unique accepted team members
    const { data: acceptedInvites } = await adminSupabase
        .from('team_invitations')
        .select('accepted_by')
        .in('project_id', projectIds)
        .not('accepted_at', 'is', null);

    const uniqueMembers = new Set(acceptedInvites?.map(i => i.accepted_by).filter(Boolean) || []);
    const current = uniqueMembers.size;
    const allowed = current < limits.teamMembersPerProject;

    return {
        allowed,
        current,
        limit: limits.teamMembersPerProject,
        message: allowed
            ? undefined
            : `Team member limit reached (${limits.teamMembersPerProject}). Upgrade to add more team members.`,
    };
}

/**
 * Check if user is a team member (not project owner)
 */
export async function isTeamMember(userId: string, projectId: string): Promise<boolean> {
    const adminSupabase = createAdminClient();

    // Check if user owns this project
    const { data: project } = await adminSupabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single();

    if (!project) return false;

    // If user owns the project, they're not a team member
    return project.user_id !== userId;
}

/**
 * Check if user can create projects (owners only, unless admin)
 */
export async function canCreateProjects(userId: string): Promise<boolean> {
    const adminSupabase = createAdminClient();

    // Check if user owns any projects (they're an owner)
    const { count: ownedProjects } = await adminSupabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (ownedProjects && ownedProjects > 0) return true;

    // Check if user is an admin team member
    const { data: adminMembership } = await adminSupabase
        .from('team_members')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .limit(1);

    if (adminMembership && adminMembership.length > 0) return true;

    // Check if they have their own subscription (they're a potential owner)
    const { data: subscription } = await adminSupabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .single();

    // If they have their own subscription, they can create projects
    return !!subscription;
}

/**
 * Get all limits and current usage for a user (for display)
 */
export async function getUserLimitsAndUsage(userId: string) {
    const adminSupabase = createAdminClient();

    // Get user's own plan AND best team plan they belong to
    const ownPlan = await getUserPlan(userId);
    const teamPlan = await getBestTeamPlan(userId);

    // Use the better plan (team members get owner's benefits)
    const effectivePlan = getHigherPlan(ownPlan, teamPlan);
    const limits = getPlanLimits(effectivePlan);

    // Count projects they OWN
    const { count: projectCount } = await adminSupabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

    // Count team members (across all projects they own)
    const { data: projects } = await adminSupabase
        .from('projects')
        .select('id')
        .eq('user_id', userId);

    const projectIds = projects?.map(p => p.id) || [];

    const { data: acceptedInvites } = projectIds.length > 0
        ? await adminSupabase
            .from('team_invitations')
            .select('accepted_by')
            .in('project_id', projectIds)
            .not('accepted_at', 'is', null)
        : { data: [] };

    const uniqueMembers = new Set(acceptedInvites?.map(i => i.accepted_by).filter(Boolean) || []);

    // Check if user is purely a team member (doesn't own projects)
    const isTeamMemberOnly = (projectCount || 0) === 0 && teamPlan !== 'free';

    return {
        plan: effectivePlan,
        ownPlan,
        isTeamMember: isTeamMemberOnly,
        teamOwnerPlan: teamPlan !== 'free' ? teamPlan : null,
        limits,
        usage: {
            projects: projectCount || 0,
            teamMembers: uniqueMembers.size,
        },
        // Team members can't add their own team members
        canManageTeam: (projectCount || 0) > 0,
    };
}

/**
 * Get the best plan from teams the user belongs to
 */
export async function getBestTeamPlan(userId: string): Promise<string> {
    const adminSupabase = createAdminClient();

    // Get all projects user is a team member of
    const { data: memberships } = await adminSupabase
        .from('team_members')
        .select('project_id')
        .eq('user_id', userId);

    if (!memberships || memberships.length === 0) return 'free';

    const projectIds = memberships.map(m => m.project_id);

    // Get project owners
    const { data: projects } = await adminSupabase
        .from('projects')
        .select('user_id')
        .in('id', projectIds);

    if (!projects || projects.length === 0) return 'free';

    const ownerIds = [...new Set(projects.map(p => p.user_id))];

    // Get the best plan among all owners
    const { data: subscriptions } = await adminSupabase
        .from('subscriptions')
        .select('plan')
        .in('user_id', ownerIds);

    if (!subscriptions || subscriptions.length === 0) return 'free';

    // Find the highest plan
    const planOrder = ['free', 'pro', 'agency'];
    let bestPlan = 'free';
    for (const sub of subscriptions) {
        if (planOrder.indexOf(sub.plan) > planOrder.indexOf(bestPlan)) {
            bestPlan = sub.plan;
        }
    }

    return bestPlan;
}

/**
 * Return the higher of two plans
 */
function getHigherPlan(plan1: string, plan2: string): string {
    const planOrder = ['free', 'pro', 'agency'];
    return planOrder.indexOf(plan1) >= planOrder.indexOf(plan2) ? plan1 : plan2;
}

/**
 * Check if public sharing feature is available for a project
 * This checks the project owner's plan features
 */
export async function checkPublicSharingFeature(projectId: string): Promise<FeatureCheckResult> {
    const plan = await getProjectOwnerPlan(projectId);
    const allowed = planHasFeature(plan, 'publicSharing');

    return {
        allowed,
        plan,
        message: allowed
            ? undefined
            : 'Public article sharing is available on Pro and Agency plans. Upgrade to share articles with clients.',
    };
}

