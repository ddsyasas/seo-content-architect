import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getPlanLimits } from '@/lib/stripe/config';
import { TeamPageContent, type TeamPageData, type TeamMember, type Invitation } from './team-content';

/**
 * Server Component: Team settings page
 * Fetches team members and invitations server-side using Prisma
 */
export default async function SettingsTeamPage() {
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
            invitations: [],
            currentPlan: 'free',
            teamLimit: 1,
            firstProjectId: null,
        };
        return <TeamPageContent initialData={pageData} />;
    }

    // Fetch user's projects
    const userProjects = await prisma.projects.findMany({
        where: { user_id: user.id },
        select: { id: true },
    });

    const projectIds: string[] = [];
    for (const p of userProjects) {
        projectIds.push(p.id);
    }
    const firstProjectId = projectIds[0] || null;

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
                profiles_team_members_user_idToprofiles: {
                    select: {
                        full_name: true,
                        email: true,
                        avatar_url: true,
                    },
                },
            },
            distinct: ['user_id'], // Avoid duplicates if member is on multiple projects
        })
        : [];

    // Format team members
    const members: TeamMember[] = [];
    for (const m of teamMembersData) {
        members.push({
            id: m.id,
            role: m.role,
            joined_at: m.joined_at?.toISOString() || null,
            user_id: m.user_id,
            profiles: m.profiles_team_members_user_idToprofiles ? {
                full_name: m.profiles_team_members_user_idToprofiles.full_name,
                email: m.profiles_team_members_user_idToprofiles.email || '',
                avatar_url: m.profiles_team_members_user_idToprofiles.avatar_url,
            } : null,
        });
    }

    // Fetch pending invitations
    const invitationsData = projectIds.length > 0
        ? await prisma.team_invitations.findMany({
            where: {
                project_id: { in: projectIds },
                accepted_at: null,
                expires_at: { gt: new Date() },
            },
            select: {
                id: true,
                email: true,
                role: true,
                token: true,
                expires_at: true,
                created_at: true,
                project_id: true,
            },
        })
        : [];

    // Format invitations
    const invitations: Invitation[] = [];
    for (const inv of invitationsData) {
        invitations.push({
            id: inv.id,
            email: inv.email,
            role: inv.role,
            token: inv.token,
            expires_at: inv.expires_at.toISOString(),
            created_at: inv.created_at?.toISOString() || null,
            project_id: inv.project_id,
        });
    }

    const pageData: TeamPageData = {
        members,
        invitations,
        currentPlan,
        teamLimit,
        firstProjectId,
    };

    return <TeamPageContent initialData={pageData} />;
}
