import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getPlanLimits } from '@/lib/stripe/config';
import { sendProjectAssignmentEmail } from '@/lib/email/brevo';

// GET /api/team - Get all team members across owner's projects
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        // Keep admin client for auth admin API only
        const adminSupabase = createAdminClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check subscription
        const subscription = await prisma.subscriptions.findUnique({
            where: { user_id: user.id },
            select: { plan: true },
        });

        const plan = subscription?.plan || 'free';
        const limits = getPlanLimits(plan);

        if (plan === 'free') {
            return NextResponse.json({
                error: 'Team feature requires Pro or Agency plan',
                plan: 'free'
            }, { status: 403 });
        }

        // Get all projects owned by user
        const projects = await prisma.projects.findMany({
            where: { user_id: user.id },
            select: { id: true, name: true },
            orderBy: { created_at: 'desc' },
        });

        const projectIds = projects.map(p => p.id);

        // Get all team members from team_members table
        const teamData = projectIds.length > 0
            ? await prisma.team_members.findMany({
                where: { project_id: { in: projectIds } },
                select: { id: true, role: true, joined_at: true, user_id: true, project_id: true },
            })
            : [];

        // Get ALL accepted invitations (these represent team members regardless of project assignment)
        const acceptedInvites = projectIds.length > 0
            ? await prisma.team_invitations.findMany({
                where: {
                    project_id: { in: projectIds },
                    accepted_at: { not: null },
                },
                select: { id: true, email: true, role: true, accepted_at: true, project_id: true },
            })
            : [];

        // Build member list - PRIORITY: accepted invitations define team membership
        // Project assignments are secondary
        const memberMap = new Map();

        // First, add all accepted invitations as team members (with or without projects)
        if (acceptedInvites.length > 0) {
            // Get all users to match by email (since accepted_by field doesn't exist)
            const { data: authUserData } = await adminSupabase.auth.admin.listUsers();

            for (const inv of acceptedInvites) {
                // Find user by email since accepted_by doesn't exist in schema
                const matchedUser = authUserData?.users?.find(
                    u => u.email?.toLowerCase() === inv.email.toLowerCase()
                );
                const userId = matchedUser?.id || null;

                if (userId && !memberMap.has(userId)) {
                    // Get profile for this user
                    let profile = null;
                    const profileData = await prisma.profiles.findUnique({
                        where: { id: userId },
                        select: { id: true, full_name: true, email: true, avatar_url: true },
                    });

                    if (profileData) {
                        profile = profileData;
                    } else {
                        // Try to get from auth
                        try {
                            const { data: authData } = await adminSupabase.auth.admin.getUserById(userId);
                            if (authData?.user) {
                                profile = {
                                    id: userId,
                                    email: authData.user.email || inv.email,
                                    full_name: authData.user.user_metadata?.full_name || null,
                                    avatar_url: null,
                                };
                            }
                        } catch (e) {
                            profile = { id: userId, email: inv.email, full_name: null, avatar_url: null };
                        }
                    }

                    memberMap.set(userId, {
                        id: inv.id,
                        role: inv.role,
                        joined_at: inv.accepted_at,
                        user_id: userId,
                        profiles: profile || { email: inv.email, full_name: null, avatar_url: null },
                        assigned_projects: [], // Start with empty, will be filled from team_members
                    });
                }
            }
        }

        // Now add project assignments from team_members table
        teamData.forEach(m => {
            if (memberMap.has(m.user_id)) {
                const existing = memberMap.get(m.user_id);
                if (!existing.assigned_projects.includes(m.project_id)) {
                    existing.assigned_projects.push(m.project_id);
                }
                // Update role if they have a project assignment (might be more recent)
                existing.role = m.role;
            } else {
                // This is a team_member without a corresponding accepted invitation
                // (shouldn't happen in new flow, but handle legacy data)
                memberMap.set(m.user_id, {
                    id: m.id,
                    role: m.role,
                    joined_at: m.joined_at,
                    user_id: m.user_id,
                    profiles: { email: 'Unknown', full_name: null, avatar_url: null },
                    assigned_projects: [m.project_id],
                });
            }
        });

        // Fetch proper profiles for any legacy members (using Supabase Auth Admin)
        for (const [userId, member] of memberMap) {
            if (member.profiles.email === 'Unknown') {
                try {
                    const { data: authData } = await adminSupabase.auth.admin.getUserById(userId);
                    if (authData?.user) {
                        member.profiles = {
                            id: userId,
                            email: authData.user.email || 'Unknown',
                            full_name: authData.user.user_metadata?.full_name || null,
                            avatar_url: null,
                        };
                    }
                } catch (e) {
                    // Keep Unknown
                }
            }
        }

        return NextResponse.json({
            members: Array.from(memberMap.values()),
            projects: projects,
            plan,
            teamLimit: limits.teamMembersPerProject,
            currentUserEmail: user.email,
        });
    } catch (error) {
        console.error('Team fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/team - Assign/unassign a team member to/from a project
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        // Keep admin client for auth admin API only
        const adminSupabase = createAdminClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, projectId, role, action } = await request.json();

        // Verify the project belongs to the current user
        const project = await prisma.projects.findFirst({
            where: {
                id: projectId,
                user_id: user.id,
            },
            select: { id: true, user_id: true },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
        }

        if (action === 'assign') {
            // Add team member to project (upsert)
            await prisma.team_members.upsert({
                where: {
                    project_id_user_id: {
                        project_id: projectId,
                        user_id: userId,
                    },
                },
                update: { role: role || 'editor' },
                create: {
                    project_id: projectId,
                    user_id: userId,
                    role: role || 'editor',
                },
            });

            // Send email notification to the assigned user
            try {
                // Get project name
                const projectData = await prisma.projects.findUnique({
                    where: { id: projectId },
                    select: { name: true },
                });

                // Get assigned user's email (using Supabase Auth Admin)
                const { data: userData } = await adminSupabase.auth.admin.getUserById(userId);

                // Get owner's info
                const ownerProfile = await prisma.profiles.findUnique({
                    where: { id: user.id },
                    select: { full_name: true },
                });

                if (userData?.user?.email && projectData?.name) {
                    // Get user's profile for their name
                    const userProfile = await prisma.profiles.findUnique({
                        where: { id: userId },
                        select: { full_name: true },
                    });

                    // Build project URL
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                    const projectUrl = `${baseUrl}/project/${projectId}`;

                    // Send the actual email
                    const emailResult = await sendProjectAssignmentEmail({
                        to: userData.user.email,
                        toName: userProfile?.full_name || undefined,
                        ownerName: ownerProfile?.full_name || user.email || 'Team Owner',
                        projectName: projectData.name,
                        role: role || 'editor',
                        projectUrl,
                    });

                    console.log(`[EMAIL] Project assignment notification sent:`, emailResult);
                }
            } catch (emailError) {
                console.error('Error sending notification email:', emailError);
                // Don't fail the assignment if email fails
            }
        } else if (action === 'unassign') {
            // Remove team member from project (but they remain in team via invitation)
            await prisma.team_members.deleteMany({
                where: {
                    project_id: projectId,
                    user_id: userId,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Team assignment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
