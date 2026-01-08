import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// GET /api/invitations/[token] - Get invitation details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const supabase = await createClient();

        // Get invitation with project info
        const { data: invitation, error } = await supabase
            .from('team_invitations')
            .select(`
                id,
                email,
                role,
                expires_at,
                accepted_at,
                project_id,
                projects:project_id (
                    name,
                    domain
                ),
                inviter:invited_by (
                    full_name,
                    email
                )
            `)
            .eq('token', token)
            .single();

        if (error || !invitation) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        // Check if expired
        if (new Date(invitation.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
        }

        // Check if already accepted
        if (invitation.accepted_at) {
            return NextResponse.json({ error: 'Invitation has already been accepted' }, { status: 410 });
        }

        return NextResponse.json({ invitation });
    } catch (error) {
        console.error('Get invitation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/invitations/[token]/accept - Accept invitation
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Please log in to accept invitation' }, { status: 401 });
        }

        // Get invitation
        const { data: invitation, error } = await supabase
            .from('team_invitations')
            .select('id, email, role, expires_at, accepted_at, project_id')
            .eq('token', token)
            .single();

        if (error || !invitation) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        // Check if expired
        if (new Date(invitation.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
        }

        // Check if already accepted
        if (invitation.accepted_at) {
            return NextResponse.json({ error: 'Invitation has already been accepted' }, { status: 410 });
        }

        // Check if invitation is for this user's email
        const userEmail = user.email?.toLowerCase();

        if (!userEmail || userEmail !== invitation.email.toLowerCase()) {
            return NextResponse.json({
                error: 'This invitation was sent to a different email address',
                invitedEmail: invitation.email,
                currentEmail: userEmail || 'unknown',
            }, { status: 403 });
        }

        // Use admin client to bypass RLS for these operations
        const adminSupabase = createAdminClient();

        // Check if user already has any team membership for this owner's projects
        // Get project owner ID from the invitation's project
        const { data: projectData } = await adminSupabase
            .from('projects')
            .select('user_id')
            .eq('id', invitation.project_id)
            .single();

        const ownerId = projectData?.user_id;

        if (!ownerId) {
            return NextResponse.json({ error: 'Project owner not found' }, { status: 404 });
        }

        // Check if already in team by looking at any project owned by this owner
        const { data: ownerProjects } = await adminSupabase
            .from('projects')
            .select('id')
            .eq('user_id', ownerId);

        const projectIds = ownerProjects?.map(p => p.id) || [];

        const { data: existingMember } = await adminSupabase
            .from('team_members')
            .select('id')
            .eq('user_id', user.id)
            .in('project_id', projectIds)
            .limit(1);

        if (existingMember && existingMember.length > 0) {
            // Already in team - just mark invitation as accepted
            await adminSupabase
                .from('team_invitations')
                .update({ accepted_at: new Date().toISOString() })
                .eq('id', invitation.id);

            return NextResponse.json({
                success: true,
                message: 'You are already part of this team',
            });
        }

        // Add user to team with NO project assigned yet (use a placeholder record)
        // We'll use the invitation's project_id but owner will need to explicitly assign projects
        // For now, just mark them as a team member on the original project
        // BUT we won't redirect them there - owner must explicitly share

        // Don't create any team_members entry - just mark invitation accepted
        // Owner will assign projects from Dashboard > Team

        // Mark invitation as accepted
        await adminSupabase
            .from('team_invitations')
            .update({
                accepted_at: new Date().toISOString(),
                accepted_by: user.id  // Store who accepted for reference
            })
            .eq('id', invitation.id);

        return NextResponse.json({
            success: true,
            message: 'Successfully joined the team! The owner will assign you to projects.',
        });
    } catch (error) {
        console.error('Accept invitation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


