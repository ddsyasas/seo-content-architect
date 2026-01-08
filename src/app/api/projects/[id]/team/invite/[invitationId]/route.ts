import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE /api/projects/[id]/team/invite/[invitationId] - Cancel an invitation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
    try {
        const { id: projectId, invitationId } = await params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is owner/admin of this project
        const { data: membership } = await supabase
            .from('team_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single();

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json({ error: 'Not authorized to manage invitations' }, { status: 403 });
        }

        // Delete the invitation
        const { error: deleteError } = await supabase
            .from('team_invitations')
            .delete()
            .eq('id', invitationId)
            .eq('project_id', projectId);

        if (deleteError) {
            console.error('Error deleting invitation:', deleteError);
            return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Invitation cancelled successfully' });
    } catch (error) {
        console.error('Delete invitation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
