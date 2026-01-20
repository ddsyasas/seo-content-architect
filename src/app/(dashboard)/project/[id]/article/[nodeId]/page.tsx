import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ArticleEditor } from '@/components/editor/article-editor';
import { planHasFeature } from '@/lib/stripe/config';
import type { Project, ContentNode, Article } from '@/lib/types';
import type { UserRole } from '@/lib/utils/roles';

interface ArticlePageProps {
    params: Promise<{ id: string; nodeId: string }>;
}

/**
 * Server Component: Article editor page
 * Fetches project, node, article data and permissions server-side using Prisma
 */
export default async function ArticlePage({ params }: ArticlePageProps) {
    const { id: projectId, nodeId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch project data using Prisma
    const projectData = await prisma.projects.findUnique({
        where: { id: projectId },
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
        userRole = 'owner';
    } else {
        const teamMember = await prisma.team_members.findFirst({
            where: {
                project_id: projectId,
                user_id: user.id,
            },
            select: { role: true },
        });

        if (teamMember) {
            userRole = teamMember.role as UserRole;
        } else {
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

    // Fetch node data
    const nodeData = await prisma.nodes.findUnique({
        where: { id: nodeId },
    });

    if (!nodeData) {
        notFound();
    }

    // Convert to ContentNode type
    const node: ContentNode = {
        id: nodeData.id,
        project_id: nodeData.project_id,
        node_type: nodeData.node_type as ContentNode['node_type'],
        title: nodeData.title,
        slug: nodeData.slug,
        url: nodeData.url,
        target_keyword: nodeData.target_keyword,
        status: (nodeData.status || 'planned') as ContentNode['status'],
        notes: nodeData.notes,
        word_count_target: nodeData.word_count_target,
        assigned_to: nodeData.assigned_to,
        publish_date: nodeData.publish_date?.toISOString() || null,
        position_x: nodeData.position_x,
        position_y: nodeData.position_y,
        color: nodeData.color,
        is_public: nodeData.is_public || false,
        share_id: nodeData.share_id,
        created_at: nodeData.created_at?.toISOString() || new Date().toISOString(),
        updated_at: nodeData.updated_at?.toISOString() || new Date().toISOString(),
    };

    // Fetch article data
    const articleData = await prisma.articles.findUnique({
        where: { node_id: nodeId },
    });

    const article: Article | null = articleData ? {
        id: articleData.id,
        node_id: articleData.node_id,
        project_id: articleData.project_id,
        content: articleData.content || '',
        word_count: articleData.word_count || 0,
        seo_title: articleData.seo_title,
        seo_description: articleData.seo_description,
        created_at: articleData.created_at?.toISOString() || new Date().toISOString(),
        updated_at: articleData.updated_at?.toISOString() || new Date().toISOString(),
    } : null;

    // Fetch available nodes for interlinking
    const availableNodesData = await prisma.nodes.findMany({
        where: {
            project_id: projectId,
            id: { not: nodeId },
            node_type: { not: 'external' },
        },
        select: {
            id: true,
            title: true,
            slug: true,
        },
    });

    const availableNodes = availableNodesData.map(n => ({
        id: n.id,
        title: n.title,
        slug: n.slug || '',
    }));

    // Check public sharing capability based on subscription
    const subscription = await prisma.subscriptions.findUnique({
        where: { user_id: projectData.user_id },
        select: { plan: true },
    });
    const plan = subscription?.plan || 'free';
    const canPublicShare = planHasFeature(plan, 'publicSharing');

    return (
        <ArticleEditor
            projectId={projectId}
            nodeId={nodeId}
            initialProject={project}
            initialNode={node}
            initialArticle={article}
            initialUserRole={userRole}
            initialAvailableNodes={availableNodes}
            initialCanPublicShare={canPublicShare}
        />
    );
}
