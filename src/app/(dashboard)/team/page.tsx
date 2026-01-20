import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getPlanLimits } from '@/lib/stripe/config';
import { TeamDashboardContent, type TeamPageData, type TeamMember, type Project } from './team-content';

/**
 * Server Component: Team dashboard page
 * Fetches team members and projects server-side using Prisma
 */
export default async function TeamPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch user's subscription/plan
    const subscription = await prisma.subscriptions.findUnique({
        where: { user_id: user.id },
        select: { plan: true },
    });

    const currentPlan = subscription?.plan || 'free';
    const planLimits = getPlanLimits(currentPlan);
    const teamLimit = planLimits.teamMembersPerProject;

    // If free plan, return early with minimal data
    if (currentPlan === 'free') {
        const pageData: TeamPageData = {
            members: [],
            projects: [],
            currentPlan: 'free',
            teamLimit: 1,
            currentUserEmail: user.email || '',
        };
        return <TeamDashboardContent initialData={pageData} />;
    }

    // Fetch user's projects
    const userProjects = await prisma.projects.findMany({
        where: { user_id: user.id },
        select: { id: true, name: true },
    });

    const projectIds = userProjects.map(p => p.id);

    // Fetch the owner as a "member" (the current user)
    const ownerProfile = await prisma.profiles.findUnique({
        where: { id: user.id },
        select: {
            full_name: true,
            email: true,
            avatar_url: true,
        },
    });

    // Create owner member entry
    const ownerMember: TeamMember = {
        id: user.id,
        role: 'owner',
        joined_at: null,
        user_id: user.id,
        profiles: ownerProfile ? {
            full_name: ownerProfile.full_name,
            email: ownerProfile.email || user.email || '',
            avatar_url: ownerProfile.avatar_url,
        } : null,
        assigned_projects: projectIds, // Owner has access to all projects
    };

    // Fetch team members across all projects owned by the user
    const teamMembersData = projectIds.length > 0
        ? await prisma.team_members.findMany({
            where: {
                project_id: { in: projectIds },
            },
            select: {
                id: true,
                role: true,
                joined_at: true,
                user_id: true,
                project_id: true,
                profiles_team_members_user_idToprofiles: {
                    select: {
                        full_name: true,
                        email: true,
                        avatar_url: true,
                    },
                },
            },
        })
        : [];

    // Group team members by user_id and collect their assigned projects
    const memberMap = new Map<string, TeamMember>();

    for (const m of teamMembersData) {
        const existing = memberMap.get(m.user_id);
        if (existing) {
            // Add this project to the member's assigned projects
            if (!existing.assigned_projects.includes(m.project_id)) {
                existing.assigned_projects.push(m.project_id);
            }
        } else {
            memberMap.set(m.user_id, {
                id: m.id,
                role: m.role,
                joined_at: m.joined_at?.toISOString() || null,
                user_id: m.user_id,
                profiles: m.profiles_team_members_user_idToprofiles ? {
                    full_name: m.profiles_team_members_user_idToprofiles.full_name,
                    email: m.profiles_team_members_user_idToprofiles.email || '',
                    avatar_url: m.profiles_team_members_user_idToprofiles.avatar_url,
                } : null,
                assigned_projects: [m.project_id],
            });
        }
    }

    const teamMembers = Array.from(memberMap.values());

    // Combine owner + team members
    const allMembers: TeamMember[] = [ownerMember, ...teamMembers];

    // Format projects
    const projects: Project[] = userProjects.map(p => ({
        id: p.id,
        name: p.name,
    }));

    const pageData: TeamPageData = {
        members: allMembers,
        projects,
        currentPlan,
        teamLimit,
        currentUserEmail: user.email || '',
    };

    return <TeamDashboardContent initialData={pageData} />;
}
