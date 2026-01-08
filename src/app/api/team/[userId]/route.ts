import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// PATCH /api/team/[userId] - Update team member role
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId: memberUserId } = await params;
        const supabase = await createClient();
        const adminSupabase = createAdminClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { role } = await request.json();

        if (!['admin', 'editor', 'viewer'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Get all projects owned by current user
        const { data: projects } = await adminSupabase
            .from('projects')
            .select('id')
            .eq('user_id', user.id);

        if (!projects || projects.length === 0) {
            return NextResponse.json({ error: 'No projects found' }, { status: 404 });
        }

        const projectIds = projects.map(p => p.id);

        // Update role for this member across all owner's projects
        const { error } = await adminSupabase
            .from('team_members')
            .update({ role })
            .eq('user_id', memberUserId)
            .in('project_id', projectIds);

        if (error) {
            console.error('Error updating role:', error);
            return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
        }

        // Also update the role in accepted invitation for consistency
        await adminSupabase
            .from('team_invitations')
            .update({ role })
            .eq('accepted_by', memberUserId)
            .in('project_id', projectIds);

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
        const adminSupabase = createAdminClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all projects owned by current user
        const { data: projects } = await adminSupabase
            .from('projects')
            .select('id')
            .eq('user_id', user.id);

        if (!projects || projects.length === 0) {
            return NextResponse.json({ error: 'No projects found' }, { status: 404 });
        }

        const projectIds = projects.map(p => p.id);

        // Remove member from all owner's projects
        const { error } = await adminSupabase
            .from('team_members')
            .delete()
            .eq('user_id', memberUserId)
            .in('project_id', projectIds);

        if (error) {
            console.error('Error removing member:', error);
            return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
        }

        // Also clear the accepted_by from invitations so they appear as "not accepted"
        // This effectively removes them from the team
        await adminSupabase
            .from('team_invitations')
            .update({ accepted_at: null, accepted_by: null })
            .eq('accepted_by', memberUserId)
            .in('project_id', projectIds);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Remove member error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
