import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/projects - Get all projects user can access (owned + team member)
export async function GET(request: NextRequest) {
    try {
        // Use Supabase Auth to get current user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get projects owned by user with counts
        const ownedProjects = await prisma.projects.findMany({
            where: { user_id: user.id },
            orderBy: { updated_at: 'desc' },
            include: {
                _count: {
                    select: {
                        nodes: true,
                        articles: true,
                    },
                },
            },
        });

        // Get team memberships for this user
        const teamMemberships = await prisma.team_members.findMany({
            where: { user_id: user.id },
            select: {
                project_id: true,
                role: true,
            },
        });

        // Get team projects (where user is member but not owner)
        const teamProjectIds = teamMemberships.map(m => m.project_id);
        const teamProjects = teamProjectIds.length > 0
            ? await prisma.projects.findMany({
                where: {
                    id: { in: teamProjectIds },
                    user_id: { not: user.id }, // Exclude owned projects
                },
                include: {
                    _count: {
                        select: {
                            nodes: true,
                            articles: true,
                        },
                    },
                },
            })
            : [];

        // Combine and mark projects with their access type and counts
        const allProjects = [
            ...ownedProjects.map(p => ({
                id: p.id,
                user_id: p.user_id,
                name: p.name,
                description: p.description,
                website_url: p.website_url,
                domain: p.domain,
                color: p.color,
                created_at: p.created_at,
                updated_at: p.updated_at,
                accessType: 'owner' as const,
                role: 'owner',
                nodeCount: p._count.nodes,
                articleCount: p._count.articles,
            })),
            ...teamProjects.map(p => {
                const membership = teamMemberships.find(m => m.project_id === p.id);
                return {
                    id: p.id,
                    user_id: p.user_id,
                    name: p.name,
                    description: p.description,
                    website_url: p.website_url,
                    domain: p.domain,
                    color: p.color,
                    created_at: p.created_at,
                    updated_at: p.updated_at,
                    accessType: 'team_member' as const,
                    role: membership?.role || 'viewer',
                    nodeCount: p._count.nodes,
                    articleCount: p._count.articles,
                };
            }),
        ];

        // Sort by updated_at
        allProjects.sort((a, b) =>
            new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime()
        );

        return NextResponse.json({
            projects: allProjects,
            ownedCount: ownedProjects.length,
            teamMemberCount: teamProjects.length,
        });
    } catch (error) {
        console.error('Projects fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

