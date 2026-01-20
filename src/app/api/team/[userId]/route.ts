import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/team/[userId] - Update team member role
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId: memberUserId } = await params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { role } = await request.json();

        if (!['admin', 'editor', 'viewer'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Get all projects owned by current user
        const projects = await prisma.projects.findMany({
            where: { user_id: user.id },
            select: { id: true },
        });

        if (projects.length === 0) {
            return NextResponse.json({ error: 'No projects found' }, { status: 404 });
        }

        const projectIds = projects.map(p => p.id);

        // Update role for this member across all owner's projects
        await prisma.team_members.updateMany({
            where: {
                user_id: memberUserId,
                project_id: { in: projectIds },
            },
            data: { role },
        });

        // Note: accepted_by field doesn't exist in schema, so we can't track role changes in invitations
        // The role is tracked in team_members table which we've already updated

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Role update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/team/[userId] - Remove team member from all projects
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId: memberUserId } = await params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all projects owned by current user
        const projects = await prisma.projects.findMany({
            where: { user_id: user.id },
            select: { id: true },
        });

        if (projects.length === 0) {
            return NextResponse.json({ error: 'No projects found' }, { status: 404 });
        }

        const projectIds = projects.map(p => p.id);

        // Remove member from all owner's projects
        await prisma.team_members.deleteMany({
            where: {
                user_id: memberUserId,
                project_id: { in: projectIds },
            },
        });

        // Note: We can't clear invitations by user_id since accepted_by doesn't exist in schema
        // The member is removed from team_members table which is the source of truth for team membership

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Remove member error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
