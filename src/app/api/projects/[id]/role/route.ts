import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/projects/[id]/role
 * Get the current user's role for a specific project
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is the project owner
        const project = await prisma.projects.findUnique({
            where: { id: projectId },
            select: { user_id: true },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (project.user_id === user.id) {
            return NextResponse.json({ role: 'owner' });
        }

        // Check team membership
        const membership = await prisma.team_members.findFirst({
            where: {
                project_id: projectId,
                user_id: user.id,
            },
            select: { role: true },
        });

        if (membership) {
            return NextResponse.json({ role: membership.role });
        }

        // User has no access to this project
        return NextResponse.json({ role: 'viewer', message: 'No membership found' });
    } catch (error) {
        console.error('Error getting user role:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
