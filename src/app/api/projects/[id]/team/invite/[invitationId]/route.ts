import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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
        const membership = await prisma.team_members.findFirst({
            where: {
                project_id: projectId,
                user_id: user.id,
            },
            select: { role: true },
        });

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json({ error: 'Not authorized to manage invitations' }, { status: 403 });
        }

        // Delete the invitation
        await prisma.team_invitations.deleteMany({
            where: {
                id: invitationId,
                project_id: projectId,
            },
        });

        return NextResponse.json({ message: 'Invitation cancelled successfully' });
    } catch (error) {
        console.error('Delete invitation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
