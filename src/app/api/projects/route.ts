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
        const teamProjectIds: string[] = [];
        for (const m of teamMemberships) {
            teamProjectIds.push(m.project_id);
        }
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
        type ProjectWithAccess = {
            id: string;
            user_id: string;
            name: string;
            description: string | null;
            website_url: string | null;
            domain: string | null;
            color: string | null;
            created_at: Date | null;
            updated_at: Date | null;
            accessType: 'owner' | 'team_member';
            role: string;
            nodeCount: number;
            articleCount: number;
        };
        const allProjects: ProjectWithAccess[] = [];

        for (const p of ownedProjects) {
            allProjects.push({
                id: p.id,
                user_id: p.user_id,
                name: p.name,
                description: p.description,
                website_url: p.website_url,
                domain: p.domain,
                color: p.color,
                created_at: p.created_at,
                updated_at: p.updated_at,
                accessType: 'owner',
                role: 'owner',
                nodeCount: p._count.nodes,
                articleCount: p._count.articles,
            });
        }

        for (const p of teamProjects) {
            let memberRole = 'viewer';
            for (const m of teamMemberships) {
                if (m.project_id === p.id) {
                    memberRole = m.role;
                    break;
                }
            }
            allProjects.push({
                id: p.id,
                user_id: p.user_id,
                name: p.name,
                description: p.description,
                website_url: p.website_url,
                domain: p.domain,
                color: p.color,
                created_at: p.created_at,
                updated_at: p.updated_at,
                accessType: 'team_member',
                role: memberRole,
                nodeCount: p._count.nodes,
                articleCount: p._count.articles,
            });
        }

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

