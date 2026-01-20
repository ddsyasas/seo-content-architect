import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getPlanLimits } from '@/lib/stripe/config';
import { ProjectsPageContent } from './projects-content';
import type { Project } from '@/lib/types';

export interface LimitsData {
    plan: string;
    limits: {
        projects: number;
        articlesPerProject: number;
        nodesPerProject: number;
        teamMembersPerProject: number;
    };
    usage: {
        projects: number;
        teamMembers: number;
    };
    canCreateProjects: boolean;
}

/**
 * Server Component: Projects page
 * Fetches projects and limits server-side using Prisma
 */
export default async function ProjectsPage() {
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
    const userPlan = subscription?.plan || 'free';
    const planLimits = getPlanLimits(userPlan);

    // Fetch owned projects
    const ownedProjects = await prisma.projects.findMany({
        where: { user_id: user.id },
        orderBy: { updated_at: 'desc' },
    });

    // Fetch team memberships
    const teamMemberships = await prisma.team_members.findMany({
        where: { user_id: user.id },
        select: { project_id: true, role: true },
    });

    // Fetch team projects
    const teamProjectIds: string[] = [];
    for (const m of teamMemberships) {
        teamProjectIds.push(m.project_id);
    }
    const teamProjects = teamProjectIds.length > 0
        ? await prisma.projects.findMany({
            where: { id: { in: teamProjectIds } },
            orderBy: { updated_at: 'desc' },
        })
        : [];

    // Build projects list with access info and counts
    type ProjectWithCounts = Awaited<typeof ownedProjects>[0] & {
        accessType: 'owner' | 'team';
        role: string;
        nodeCount: number;
        articleCount: number;
    };

    const projectsWithCounts: ProjectWithCounts[] = [];

    for (const p of ownedProjects) {
        const nodeCount = await prisma.nodes.count({ where: { project_id: p.id } });
        const articleCount = await prisma.articles.count({ where: { project_id: p.id } });
        projectsWithCounts.push({
            ...p,
            accessType: 'owner' as const,
            role: 'owner' as const,
            nodeCount,
            articleCount,
        });
    }

    for (const p of teamProjects) {
        const membership = teamMemberships.find((m: { project_id: string; role: string }) => m.project_id === p.id);
        const nodeCount = await prisma.nodes.count({ where: { project_id: p.id } });
        const articleCount = await prisma.articles.count({ where: { project_id: p.id } });
        projectsWithCounts.push({
            ...p,
            accessType: 'team' as const,
            role: membership?.role || 'viewer',
            nodeCount,
            articleCount,
        });
    }

    // Dedupe (in case user owns a project they're also a team member of)
    const projectsMap = new Map<string, ProjectWithCounts>();
    for (const p of projectsWithCounts) {
        if (!projectsMap.has(p.id) || p.accessType === 'owner') {
            projectsMap.set(p.id, p);
        }
    }
    const projects = Array.from(projectsMap.values());

    // Calculate limits data
    let ownedCount = 0;
    for (const p of projects) {
        if (p.accessType === 'owner') ownedCount++;
    }

    // Check if user can create projects (must be owner or have their own subscription)
    const canCreateProjects = ownedProjects.length > 0 || !!subscription;

    const limits: LimitsData = {
        plan: userPlan,
        limits: planLimits,
        usage: {
            projects: ownedCount,
            teamMembers: 0, // Not needed for this page
        },
        canCreateProjects,
    };

    // Convert dates to strings for serialization
    const serializedProjects: Project[] = [];
    for (const p of projects) {
        serializedProjects.push({
            ...p,
            created_at: p.created_at?.toISOString() || null,
            updated_at: p.updated_at?.toISOString() || null,
        } as Project);
    }

    return (
        <ProjectsPageContent
            initialProjects={serializedProjects}
            initialLimits={limits}
        />
    );
}
