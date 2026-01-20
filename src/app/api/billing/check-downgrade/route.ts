import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getPlanLimits, PlanType } from '@/lib/stripe/config';

/**
 * POST /api/billing/check-downgrade
 * Check if user's current usage allows downgrade to target plan
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { targetPlan } = body as { targetPlan: PlanType };

        if (!targetPlan) {
            return NextResponse.json({ error: 'Target plan required' }, { status: 400 });
        }

        const targetLimits = getPlanLimits(targetPlan);
        const blockers: string[] = [];

        // Check project count
        const projectCount = await prisma.projects.count({
            where: { user_id: user.id },
        });

        if (projectCount > targetLimits.projects) {
            blockers.push(
                `You have ${projectCount} projects, but ${targetPlan} plan allows only ${targetLimits.projects}. ` +
                `Please delete ${projectCount - targetLimits.projects} project(s).`
            );
        }

        // Check articles per project (find max across all projects)
        const projects = await prisma.projects.findMany({
            where: { user_id: user.id },
            select: { id: true, name: true },
        });

        for (const project of projects) {
            const articleCount = await prisma.nodes.count({
                where: {
                    project_id: project.id,
                    node_type: { not: 'external' },
                },
            });

            if (articleCount > targetLimits.articlesPerProject) {
                blockers.push(
                    `Project "${project.name}" has ${articleCount} articles, but ${targetPlan} plan allows only ${targetLimits.articlesPerProject}. ` +
                    `Please delete ${articleCount - targetLimits.articlesPerProject} article(s).`
                );
            }

            // Check nodes per project
            const nodeCount = await prisma.nodes.count({
                where: { project_id: project.id },
            });

            if (nodeCount > targetLimits.nodesPerProject) {
                blockers.push(
                    `Project "${project.name}" has ${nodeCount} nodes, but ${targetPlan} plan allows only ${targetLimits.nodesPerProject}. ` +
                    `Please delete ${nodeCount - targetLimits.nodesPerProject} node(s).`
                );
            }

            // Check team members per project
            const teamCount = await prisma.team_members.count({
                where: { project_id: project.id },
            });

            if (teamCount > targetLimits.teamMembersPerProject) {
                blockers.push(
                    `Project "${project.name}" has ${teamCount} team members, but ${targetPlan} plan allows only ${targetLimits.teamMembersPerProject}. ` +
                    `Please remove ${teamCount - targetLimits.teamMembersPerProject} team member(s).`
                );
            }
        }

        return NextResponse.json({
            allowed: blockers.length === 0,
            blockers,
            targetPlan,
            targetLimits,
        });
    } catch (error) {
        console.error('Check downgrade error:', error);
        return NextResponse.json(
            { error: 'Failed to check downgrade eligibility' },
            { status: 500 }
        );
    }
}
