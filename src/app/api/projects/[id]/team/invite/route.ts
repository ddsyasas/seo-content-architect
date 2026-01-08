import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanLimits } from '@/lib/stripe/config';
import crypto from 'crypto';

// POST /api/projects/[id]/team/invite - Send team invitation
export async function POST(
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

        const body = await request.json();
        const { email, role } = body as { email: string; role: string };

        // Validate role
        if (!['admin', 'editor', 'viewer'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Check if user is owner/admin of this project
        const { data: membership } = await supabase
            .from('team_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single();

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json({ error: 'Not authorized to invite members' }, { status: 403 });
        }

        // Get project owner's subscription plan for limits
        const { data: project } = await supabase
            .from('projects')
            .select('user_id')
            .eq('id', projectId)
            .single();

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', project.user_id)
            .single();

        const plan = subscription?.plan || 'free';
        const limits = getPlanLimits(plan);

        // Check team member limit
        const { count: memberCount } = await supabase
            .from('team_members')
            .select('id', { count: 'exact' })
            .eq('project_id', projectId);

        const { count: pendingCount } = await supabase
            .from('team_invitations')
            .select('id', { count: 'exact' })
            .eq('project_id', projectId)
            .is('accepted_at', null)
            .gt('expires_at', new Date().toISOString());

        const totalMembers = (memberCount || 0) + (pendingCount || 0);

        if (totalMembers >= limits.teamMembersPerProject) {
            return NextResponse.json({
                error: 'Team member limit reached',
                limit: limits.teamMembersPerProject,
                current: totalMembers,
            }, { status: 403 });
        }

        // Check if email already invited
        const { data: existingInvite } = await supabase
            .from('team_invitations')
            .select('id')
            .eq('project_id', projectId)
            .eq('email', email.toLowerCase())
            .is('accepted_at', null)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (existingInvite) {
            return NextResponse.json({ error: 'This email already has a pending invitation' }, { status: 400 });
        }

        // Check if already a member - get member emails
        const { data: existingMembers } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('project_id', projectId);

        if (existingMembers && existingMembers.length > 0) {
            // Get profiles for these user IDs
            const userIds = existingMembers.map(m => m.user_id);
            const { data: profiles } = await supabase
                .from('profiles')
                .select('email')
                .in('id', userIds);

            const isAlreadyMember = profiles?.some(
                p => p.email?.toLowerCase() === email.toLowerCase()
            );

            if (isAlreadyMember) {
                return NextResponse.json({ error: 'This person is already a team member' }, { status: 400 });
            }
        }

        // Create invitation
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const { data: invitation, error: insertError } = await supabase
            .from('team_invitations')
            .insert({
                project_id: projectId,
                email: email.toLowerCase(),
                role,
                invited_by: user.id,
                token,
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating invitation:', insertError);
            return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const inviteLink = `${appUrl}/invite/${token}`;

        // Get project name and inviter info for email
        const { data: projectInfo } = await supabase
            .from('projects')
            .select('name')
            .eq('id', projectId)
            .single();

        const { data: inviterProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

        // Send invitation email via Brevo
        try {
            const { sendTeamInviteEmail } = await import('@/lib/email/brevo');
            await sendTeamInviteEmail({
                to: email,
                inviterName: inviterProfile?.full_name || inviterProfile?.email || 'A team member',
                projectName: projectInfo?.name || 'a project',
                role,
                inviteLink,
            });
        } catch (emailError) {
            console.error('Failed to send invitation email:', emailError);
            // Don't fail the request if email fails - invitation is still created
        }

        return NextResponse.json({
            invitation,
            inviteLink,
            message: 'Invitation sent successfully',
        });
    } catch (error) {
        console.error('Invite error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

