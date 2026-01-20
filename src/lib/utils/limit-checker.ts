import { prisma } from '@/lib/prisma';
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
    // Get project owner
    const project = await prisma.projects.findUnique({
        where: { id: projectId },
        select: { user_id: true },
    });

    if (!project) return 'free';

    // Get owner's subscription
    const subscription = await prisma.subscriptions.findUnique({
        where: { user_id: project.user_id },
        select: { plan: true },
    });

    return subscription?.plan || 'free';
}

/**
 * Get user's plan
 */
export async function getUserPlan(userId: string): Promise<string> {
    const subscription = await prisma.subscriptions.findUnique({
        where: { user_id: userId },
        select: { plan: true },
    });

    return subscription?.plan || 'free';
}

/**
 * Check if user can create more projects
 */
export async function checkProjectLimit(userId: string): Promise<LimitCheckResult> {
    const plan = await getUserPlan(userId);
    const limits = getPlanLimits(plan);

    // Count existing projects
    const current = await prisma.projects.count({
        where: { user_id: userId },
    });

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
    const plan = await getProjectOwnerPlan(projectId);
    const limits = getPlanLimits(plan);

    // Count existing articles
    const current = await prisma.articles.count({
        where: { project_id: projectId },
    });

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
    const plan = await getProjectOwnerPlan(projectId);
    const limits = getPlanLimits(plan);

    // Count existing nodes
    const current = await prisma.nodes.count({
        where: { project_id: projectId },
    });

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
    const plan = await getUserPlan(ownerId);
    const limits = getPlanLimits(plan);

    // Get all owner's projects
    const projects = await prisma.projects.findMany({
        where: { user_id: ownerId },
        select: { id: true },
    });

    const projectIds = projects.map(p => p.id);

    // Count unique team members from team_members table (excluding owner)
    const teamMembers = projectIds.length > 0
        ? await prisma.team_members.findMany({
            where: {
                project_id: { in: projectIds },
                user_id: { not: ownerId }, // Exclude owner
            },
            select: { user_id: true },
        })
        : [];

    const uniqueMembers = new Set(teamMembers.map(m => m.user_id));
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
    // Check if user owns this project
    const project = await prisma.projects.findUnique({
        where: { id: projectId },
        select: { user_id: true },
    });

    if (!project) return false;

    // If user owns the project, they're not a team member
    return project.user_id !== userId;
}

/**
 * Check if user can create projects (owners only, unless admin)
 */
export async function canCreateProjects(userId: string): Promise<boolean> {
    // Check if user owns any projects (they're an owner)
    const ownedProjects = await prisma.projects.count({
        where: { user_id: userId },
    });

    if (ownedProjects > 0) return true;

    // Check if user is an admin team member
    const adminMembership = await prisma.team_members.findFirst({
        where: {
            user_id: userId,
            role: 'admin',
        },
    });

    if (adminMembership) return true;

    // Check if they have their own subscription (they're a potential owner)
    const subscription = await prisma.subscriptions.findUnique({
        where: { user_id: userId },
    });

    // If they have their own subscription, they can create projects
    return !!subscription;
}

/**
 * Get all limits and current usage for a user (for display)
 */
export async function getUserLimitsAndUsage(userId: string) {
    // Get user's own plan AND best team plan they belong to
    const ownPlan = await getUserPlan(userId);
    const teamPlan = await getBestTeamPlan(userId);

    // Use the better plan (team members get owner's benefits)
    const effectivePlan = getHigherPlan(ownPlan, teamPlan);
    const limits = getPlanLimits(effectivePlan);

    // Count projects they OWN
    const projectCount = await prisma.projects.count({
        where: { user_id: userId },
    });

    // Count team members (across all projects they own)
    const projects = await prisma.projects.findMany({
        where: { user_id: userId },
        select: { id: true },
    });

    const projectIds = projects.map(p => p.id);

    // Count unique team members from team_members table (excluding owner)
    const teamMembers = projectIds.length > 0
        ? await prisma.team_members.findMany({
            where: {
                project_id: { in: projectIds },
                user_id: { not: userId }, // Exclude owner
            },
            select: { user_id: true },
        })
        : [];

    const uniqueMembers = new Set(teamMembers.map(m => m.user_id));

    // Check if user is purely a team member (doesn't own projects)
    const isTeamMemberOnly = projectCount === 0 && teamPlan !== 'free';

    return {
        plan: effectivePlan,
        ownPlan,
        isTeamMember: isTeamMemberOnly,
        teamOwnerPlan: teamPlan !== 'free' ? teamPlan : null,
        limits,
        usage: {
            projects: projectCount,
            teamMembers: uniqueMembers.size,
        },
        // Team members can't add their own team members
        canManageTeam: projectCount > 0,
    };
}

/**
 * Get the best plan from teams the user belongs to
 */
export async function getBestTeamPlan(userId: string): Promise<string> {
    // Get all projects user is a team member of
    const memberships = await prisma.team_members.findMany({
        where: { user_id: userId },
        select: { project_id: true },
    });

    if (memberships.length === 0) return 'free';

    const projectIds = memberships.map(m => m.project_id);

    // Get project owners
    const projects = await prisma.projects.findMany({
        where: { id: { in: projectIds } },
        select: { user_id: true },
    });

    if (projects.length === 0) return 'free';

    const ownerIds = [...new Set(projects.map(p => p.user_id))];

    // Get the best plan among all owners
    const subscriptions = await prisma.subscriptions.findMany({
        where: { user_id: { in: ownerIds } },
        select: { plan: true },
    });

    if (subscriptions.length === 0) return 'free';

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

