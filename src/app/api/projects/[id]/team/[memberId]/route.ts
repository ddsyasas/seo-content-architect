import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/projects/[id]/team/[memberId] - Update member role
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; memberId: string }> }
) {
    try {
        const { id: projectId, memberId } = await params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { role } = body as { role: string };

        // Validate role
        if (!['admin', 'editor', 'viewer'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Check if user is owner/admin
        const { data: currentMembership } = await supabase
            .from('team_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single();

        if (!currentMembership || !['owner', 'admin'].includes(currentMembership.role)) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Get target member
        const { data: targetMember } = await supabase
            .from('team_members')
            .select('role, user_id')
            .eq('id', memberId)
            .eq('project_id', projectId)
            .single();

        if (!targetMember) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Cannot change owner's role
        if (targetMember.role === 'owner') {
            return NextResponse.json({ error: 'Cannot change owner role' }, { status: 403 });
        }

        // Admin cannot change other admin's role
        if (currentMembership.role === 'admin' && targetMember.role === 'admin') {
            return NextResponse.json({ error: 'Admins cannot change other admin roles' }, { status: 403 });
        }

        // Update role
        const { error: updateError } = await supabase
            .from('team_members')
            .update({ role })
            .eq('id', memberId);

        if (updateError) {
            console.error('Error updating role:', updateError);
            return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
        }

        return NextResponse.json({ success: true, newRole: role });
    } catch (error) {
        console.error('Update role error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/projects/[id]/team/[memberId] - Remove team member
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; memberId: string }> }
) {
    try {
        const { id: projectId, memberId } = await params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is owner/admin
        const { data: currentMembership } = await supabase
            .from('team_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single();

        if (!currentMembership || !['owner', 'admin'].includes(currentMembership.role)) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Get target member
        const { data: targetMember } = await supabase
            .from('team_members')
            .select('role, user_id')
            .eq('id', memberId)
            .eq('project_id', projectId)
            .single();

        if (!targetMember) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Cannot remove owner
        if (targetMember.role === 'owner') {
            return NextResponse.json({ error: 'Cannot remove project owner' }, { status: 403 });
        }

        // Admin cannot remove other admins
        if (currentMembership.role === 'admin' && targetMember.role === 'admin') {
            return NextResponse.json({ error: 'Admins cannot remove other admins' }, { status: 403 });
        }

        // Remove member
        const { error: deleteError } = await supabase
            .from('team_members')
            .delete()
            .eq('id', memberId);

        if (deleteError) {
            console.error('Error removing member:', deleteError);
            return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Remove member error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
