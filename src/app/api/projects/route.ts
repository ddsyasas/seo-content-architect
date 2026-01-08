import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// GET /api/projects - Get all projects user can access (owned + team member)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const adminSupabase = createAdminClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get projects owned by user
        const { data: ownedProjects, error: ownedError } = await adminSupabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (ownedError) {
            console.error('Error fetching owned projects:', ownedError);
        }

        // Get projects where user is a team member
        const { data: teamMemberships, error: teamError } = await adminSupabase
            .from('team_members')
            .select('project_id, role')
            .eq('user_id', user.id);

        if (teamError) {
            console.error('Error fetching team memberships:', teamError);
        }

        const teamProjectIds = teamMemberships?.map(m => m.project_id) || [];

        // Get details of team projects (excluding any owned projects)
        let teamProjects: any[] = [];
        if (teamProjectIds.length > 0) {
            const { data, error: teamProjectsError } = await adminSupabase
                .from('projects')
                .select('*')
                .in('id', teamProjectIds)
                .neq('user_id', user.id); // Exclude owned projects

            if (teamProjectsError) {
                console.error('Error fetching team projects:', teamProjectsError);
            }
            teamProjects = data || [];
        }

        // Get all project IDs to fetch counts
        const allProjectIds = [
            ...(ownedProjects || []).map(p => p.id),
            ...teamProjects.map(p => p.id),
        ];

        // Get node counts for each project
        const { data: nodeCounts } = await adminSupabase
            .from('nodes')
            .select('project_id')
            .in('project_id', allProjectIds);

        // Get article counts for each project
        const { data: articleCounts } = await adminSupabase
            .from('articles')
            .select('project_id')
            .in('project_id', allProjectIds);

        // Create count maps
        const nodeCountMap = new Map<string, number>();
        const articleCountMap = new Map<string, number>();

        nodeCounts?.forEach(n => {
            nodeCountMap.set(n.project_id, (nodeCountMap.get(n.project_id) || 0) + 1);
        });

        articleCounts?.forEach(a => {
            articleCountMap.set(a.project_id, (articleCountMap.get(a.project_id) || 0) + 1);
        });

        // Combine and mark projects with their access type and counts
        const allProjects = [
            ...(ownedProjects || []).map(p => ({
                ...p,
                accessType: 'owner' as const,
                role: 'owner',
                nodeCount: nodeCountMap.get(p.id) || 0,
                articleCount: articleCountMap.get(p.id) || 0,
            })),
            ...teamProjects.map(p => {
                const membership = teamMemberships?.find(m => m.project_id === p.id);
                return {
                    ...p,
                    accessType: 'team_member' as const,
                    role: membership?.role || 'viewer',
                    nodeCount: nodeCountMap.get(p.id) || 0,
                    articleCount: articleCountMap.get(p.id) || 0,
                };
            }),
        ];

        // Sort by updated_at
        allProjects.sort((a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        return NextResponse.json({
            projects: allProjects,
            ownedCount: ownedProjects?.length || 0,
            teamMemberCount: teamProjects.length,
        });
    } catch (error) {
        console.error('Projects fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

