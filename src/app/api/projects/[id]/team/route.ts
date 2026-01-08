import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/projects/[id]/team - List team members
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

        // First, check if user owns the project
        const { data: project } = await supabase
            .from('projects')
            .select('user_id')
            .eq('id', projectId)
            .single();

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const isOwner = project.user_id === user.id;

        // Check if user has access to this project (via team_members)
        const { data: membership } = await supabase
            .from('team_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single();

        // If user is owner but not in team_members, add them (backfill)
        if (isOwner && !membership) {
            const { error: insertError } = await supabase
                .from('team_members')
                .insert({
                    project_id: projectId,
                    user_id: user.id,
                    role: 'owner'
                });

            if (insertError) {
                console.error('Error adding owner to team:', insertError);
            }
        }

        // If not owner and not in team, deny access
        if (!isOwner && !membership) {
            return NextResponse.json({ error: 'Not authorized to view this project' }, { status: 403 });
        }

        const currentRole = membership?.role || (isOwner ? 'owner' : 'viewer');

        // Get team members with profile info
        const { data: members, error } = await supabase
            .from('team_members')
            .select(`
                id,
                role,
                joined_at,
                user_id,
                profiles:user_id (
                    full_name,
                    email,
                    avatar_url
                )
            `)
            .eq('project_id', projectId)
            .order('joined_at', { ascending: true });

        if (error) {
            console.error('Error fetching team:', error);
            return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
        }

        // Map members to handle profiles array/object
        const mappedMembers = (members || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            joined_at: m.joined_at,
            user_id: m.user_id,
            profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
        }));

        // Get pending invitations (only for owners/admins)
        let invitations: unknown[] = [];
        if (currentRole === 'owner' || currentRole === 'admin') {
            const { data: invites } = await supabase
                .from('team_invitations')
                .select('id, email, role, token, expires_at, created_at')
                .eq('project_id', projectId)
                .is('accepted_at', null)
                .gt('expires_at', new Date().toISOString());

            invitations = invites || [];
        }

        return NextResponse.json({
            members: mappedMembers,
            invitations,
            currentUserRole: currentRole,
        });
    } catch (error) {
        console.error('Team fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
