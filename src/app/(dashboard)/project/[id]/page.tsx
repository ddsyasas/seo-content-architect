import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ProjectPageClient } from '@/components/project/project-page-client';
import type { Project, ContentNode } from '@/lib/types';
import type { UserRole } from '@/lib/utils/roles';

interface ProjectPageProps {
    params: Promise<{ id: string }>;
}

/**
 * Server Component: Project page
 * Fetches project data and user role server-side using Prisma
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch project data using Prisma
    const projectData = await prisma.projects.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            description: true,
            website_url: true,
            domain: true,
            color: true,
            user_id: true,
            created_at: true,
            updated_at: true,
        },
    });

    if (!projectData) {
        notFound();
    }

    // Determine user role
    let userRole: UserRole = 'viewer';

    if (projectData.user_id === user.id) {
        // User is the owner
        userRole = 'owner';
    } else {
        // Check if user is a team member
        const teamMember = await prisma.team_members.findFirst({
            where: {
                project_id: id,
                user_id: user.id,
            },
            select: { role: true },
        });

        if (teamMember) {
            userRole = teamMember.role as UserRole;
        } else {
            // User has no access
            redirect('/dashboard');
        }
    }

    // Convert to Project type with serialized dates
    const project: Project = {
        id: projectData.id,
        name: projectData.name,
        description: projectData.description,
        website_url: projectData.website_url,
        domain: projectData.domain,
        color: projectData.color || '#6366f1',
        user_id: projectData.user_id,
        created_at: projectData.created_at?.toISOString() || new Date().toISOString(),
        updated_at: projectData.updated_at?.toISOString() || new Date().toISOString(),
    };

    // Fetch articles/nodes for the project
    const nodesData = await prisma.nodes.findMany({
        where: {
            project_id: id,
            node_type: { not: 'external' },
        },
        orderBy: { created_at: 'desc' },
    });

    // Convert to ContentNode type with serialized dates
    const articles: ContentNode[] = nodesData.map(node => ({
        id: node.id,
        project_id: node.project_id,
        node_type: node.node_type as ContentNode['node_type'],
        title: node.title,
        slug: node.slug,
        url: node.url,
        target_keyword: node.target_keyword,
        status: (node.status || 'planned') as ContentNode['status'],
        notes: node.notes,
        word_count_target: node.word_count_target,
        assigned_to: node.assigned_to,
        publish_date: node.publish_date?.toISOString() || null,
        position_x: node.position_x,
        position_y: node.position_y,
        color: node.color,
        is_public: node.is_public || false,
        share_id: node.share_id,
        created_at: node.created_at?.toISOString() || new Date().toISOString(),
        updated_at: node.updated_at?.toISOString() || new Date().toISOString(),
    }));

    return (
        <ProjectPageClient
            projectId={id}
            initialProject={project}
            initialUserRole={userRole}
            initialArticles={articles}
        />
    );
}
