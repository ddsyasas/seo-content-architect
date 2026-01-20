import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getPlanLimits } from '@/lib/stripe/config';
import crypto from 'crypto';

// POST /api/projects/[id]/team/invite - Send team invitation
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;

        // Use Supabase for auth check
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
        const membership = await prisma.team_members.findFirst({
            where: {
                project_id: projectId,
                user_id: user.id,
            },
            select: { role: true },
        });

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json({ error: 'Not authorized to invite members' }, { status: 403 });
        }

        // Get project owner's subscription plan for limits
        const project = await prisma.projects.findUnique({
            where: { id: projectId },
            select: { user_id: true },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const subscription = await prisma.subscriptions.findUnique({
            where: { user_id: project.user_id },
            select: { plan: true },
        });

        const plan = subscription?.plan || 'free';
        const limits = getPlanLimits(plan);

        // Check team member limit
        const memberCount = await prisma.team_members.count({
            where: { project_id: projectId },
        });

        const pendingCount = await prisma.team_invitations.count({
            where: {
                project_id: projectId,
                accepted_at: null,
                expires_at: { gt: new Date() },
            },
        });

        const totalMembers = memberCount + pendingCount;

        if (totalMembers >= limits.teamMembersPerProject) {
            return NextResponse.json({
                error: 'Team member limit reached',
                limit: limits.teamMembersPerProject,
                current: totalMembers,
            }, { status: 403 });
        }

        // Check if email already invited
        const existingInvite = await prisma.team_invitations.findFirst({
            where: {
                project_id: projectId,
                email: email.toLowerCase(),
                accepted_at: null,
                expires_at: { gt: new Date() },
            },
        });

        if (existingInvite) {
            return NextResponse.json({ error: 'This email already has a pending invitation' }, { status: 400 });
        }

        // Check if already a member - get member emails
        const existingMembers = await prisma.team_members.findMany({
            where: { project_id: projectId },
            select: { user_id: true },
        });

        if (existingMembers.length > 0) {
            const userIds = existingMembers.map(m => m.user_id);
            const profiles = await prisma.profiles.findMany({
                where: { id: { in: userIds } },
                select: { email: true },
            });

            const isAlreadyMember = profiles.some(
                p => p.email?.toLowerCase() === email.toLowerCase()
            );

            if (isAlreadyMember) {
                return NextResponse.json({ error: 'This person is already a team member' }, { status: 400 });
            }
        }

        // Create invitation
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const invitation = await prisma.team_invitations.create({
            data: {
                project_id: projectId,
                email: email.toLowerCase(),
                role,
                invited_by: user.id,
                token,
                expires_at: expiresAt,
            },
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const inviteLink = `${appUrl}/invite/${token}`;

        // Get project name and inviter info for email
        const projectInfo = await prisma.projects.findUnique({
            where: { id: projectId },
            select: { name: true },
        });

        const inviterProfile = await prisma.profiles.findUnique({
            where: { id: user.id },
            select: { full_name: true, email: true },
        });

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
