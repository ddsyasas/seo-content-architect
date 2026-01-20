import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/invitations/[token] - Get invitation details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        // Get invitation with project info
        const invitation = await prisma.team_invitations.findFirst({
            where: { token },
            select: {
                id: true,
                email: true,
                role: true,
                expires_at: true,
                accepted_at: true,
                project_id: true,
                projects: {
                    select: {
                        name: true,
                        domain: true,
                    },
                },
                profiles: {
                    select: {
                        full_name: true,
                        email: true,
                    },
                },
            },
        });

        if (!invitation) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        // Check if expired
        if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
        }

        // Check if already accepted
        if (invitation.accepted_at) {
            return NextResponse.json({ error: 'Invitation has already been accepted' }, { status: 410 });
        }

        // Format response to match expected structure
        const formattedInvitation = {
            ...invitation,
            inviter: invitation.profiles,
        };

        return NextResponse.json({ invitation: formattedInvitation });
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
        const invitation = await prisma.team_invitations.findFirst({
            where: { token },
            select: { id: true, email: true, role: true, expires_at: true, accepted_at: true, project_id: true },
        });

        if (!invitation) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        // Check if expired
        if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
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

        // Get project owner ID from the invitation's project
        const projectData = await prisma.projects.findUnique({
            where: { id: invitation.project_id },
            select: { user_id: true },
        });

        const ownerId = projectData?.user_id;

        if (!ownerId) {
            return NextResponse.json({ error: 'Project owner not found' }, { status: 404 });
        }

        // Check if already in team by looking at any project owned by this owner
        const ownerProjects = await prisma.projects.findMany({
            where: { user_id: ownerId },
            select: { id: true },
        });

        const projectIds = ownerProjects.map(p => p.id);

        const existingMember = await prisma.team_members.findFirst({
            where: {
                user_id: user.id,
                project_id: { in: projectIds },
            },
        });

        if (existingMember) {
            // Already in team - just mark invitation as accepted
            await prisma.team_invitations.update({
                where: { id: invitation.id },
                data: { accepted_at: new Date() },
            });

            return NextResponse.json({
                success: true,
                message: 'You are already part of this team',
            });
        }

        // Mark invitation as accepted
        await prisma.team_invitations.update({
            where: { id: invitation.id },
            data: {
                accepted_at: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Successfully joined the team! The owner will assign you to projects.',
        });
    } catch (error) {
        console.error('Accept invitation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


