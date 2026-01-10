import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
        const { count: projectCount } = await supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if ((projectCount || 0) > targetLimits.projects) {
            blockers.push(
                `You have ${projectCount} projects, but ${targetPlan} plan allows only ${targetLimits.projects}. ` +
                `Please delete ${(projectCount || 0) - targetLimits.projects} project(s).`
            );
        }

        // Check articles per project (find max across all projects)
        const { data: projects } = await supabase
            .from('projects')
            .select('id, title')
            .eq('user_id', user.id);

        if (projects) {
            for (const project of projects) {
                const { count: articleCount } = await supabase
                    .from('nodes')
                    .select('id', { count: 'exact', head: true })
                    .eq('project_id', project.id)
                    .neq('node_type', 'external');

                if ((articleCount || 0) > targetLimits.articlesPerProject) {
                    blockers.push(
                        `Project "${project.title}" has ${articleCount} articles, but ${targetPlan} plan allows only ${targetLimits.articlesPerProject}. ` +
                        `Please delete ${(articleCount || 0) - targetLimits.articlesPerProject} article(s).`
                    );
                }

                // Check nodes per project
                const { count: nodeCount } = await supabase
                    .from('nodes')
                    .select('id', { count: 'exact', head: true })
                    .eq('project_id', project.id);

                if ((nodeCount || 0) > targetLimits.nodesPerProject) {
                    blockers.push(
                        `Project "${project.title}" has ${nodeCount} nodes, but ${targetPlan} plan allows only ${targetLimits.nodesPerProject}. ` +
                        `Please delete ${(nodeCount || 0) - targetLimits.nodesPerProject} node(s).`
                    );
                }

                // Check team members per project
                const { count: teamCount } = await supabase
                    .from('team_members')
                    .select('id', { count: 'exact', head: true })
                    .eq('project_id', project.id);

                if ((teamCount || 0) > targetLimits.teamMembersPerProject) {
                    blockers.push(
                        `Project "${project.title}" has ${teamCount} team members, but ${targetPlan} plan allows only ${targetLimits.teamMembersPerProject}. ` +
                        `Please remove ${(teamCount || 0) - targetLimits.teamMembersPerProject} team member(s).`
                    );
                }
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
