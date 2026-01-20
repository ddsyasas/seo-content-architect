import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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
        const project = await prisma.projects.findUnique({
            where: { id: projectId },
            select: { user_id: true },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const isOwner = project.user_id === user.id;

        // Check if user has access to this project (via team_members)
        const membership = await prisma.team_members.findFirst({
            where: {
                project_id: projectId,
                user_id: user.id,
            },
            select: { role: true },
        });

        // If user is owner but not in team_members, add them (backfill)
        if (isOwner && !membership) {
            try {
                await prisma.team_members.create({
                    data: {
                        project_id: projectId,
                        user_id: user.id,
                        role: 'owner',
                    },
                });
            } catch (insertError) {
                console.error('Error adding owner to team:', insertError);
            }
        }

        // If not owner and not in team, deny access
        if (!isOwner && !membership) {
            return NextResponse.json({ error: 'Not authorized to view this project' }, { status: 403 });
        }

        const currentRole = membership?.role || (isOwner ? 'owner' : 'viewer');

        // Get team members with profile info
        const members = await prisma.team_members.findMany({
            where: { project_id: projectId },
            orderBy: { joined_at: 'asc' },
            include: {
                profiles_team_members_user_idToprofiles: {
                    select: {
                        full_name: true,
                        email: true,
                        avatar_url: true,
                    },
                },
            },
        });

        // Map members to match expected format
        const mappedMembers: Array<{
            id: string;
            role: string;
            joined_at: Date | null;
            user_id: string;
            profiles: { full_name: string | null; email: string | null; avatar_url: string | null } | null;
        }> = [];
        for (const m of members) {
            mappedMembers.push({
                id: m.id,
                role: m.role,
                joined_at: m.joined_at,
                user_id: m.user_id,
                profiles: m.profiles_team_members_user_idToprofiles,
            });
        }

        // Get pending invitations (only for owners/admins)
        let invitations: unknown[] = [];
        if (currentRole === 'owner' || currentRole === 'admin') {
            invitations = await prisma.team_invitations.findMany({
                where: {
                    project_id: projectId,
                    accepted_at: null,
                    expires_at: { gt: new Date() },
                },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    token: true,
                    expires_at: true,
                    created_at: true,
                },
            });
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
