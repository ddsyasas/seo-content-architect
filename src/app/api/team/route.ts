import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getPlanLimits } from '@/lib/stripe/config';
import { sendProjectAssignmentEmail } from '@/lib/email/brevo';

// GET /api/team - Get all team members across owner's projects
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const adminSupabase = createAdminClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check subscription
        const { data: subscription } = await adminSupabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', user.id)
            .single();

        const plan = subscription?.plan || 'free';
        const limits = getPlanLimits(plan);

        if (plan === 'free') {
            return NextResponse.json({
                error: 'Team feature requires Pro or Agency plan',
                plan: 'free'
            }, { status: 403 });
        }

        // Get all projects owned by user
        const { data: projects } = await adminSupabase
            .from('projects')
            .select('id, name')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        const projectIds = projects?.map(p => p.id) || [];

        // Get all team members from team_members table
        const { data: teamData } = projectIds.length > 0
            ? await adminSupabase
                .from('team_members')
                .select('id, role, joined_at, user_id, project_id')
                .in('project_id', projectIds)
            : { data: [] };

        // Get ALL accepted invitations (these represent team members regardless of project assignment)
        const { data: acceptedInvites } = projectIds.length > 0
            ? await adminSupabase
                .from('team_invitations')
                .select('id, email, role, accepted_at, accepted_by, project_id')
                .in('project_id', projectIds)
                .not('accepted_at', 'is', null)
            : { data: [] };

        // Build member list - PRIORITY: accepted invitations define team membership
        // Project assignments are secondary
        const memberMap = new Map();

        // Get user IDs from team_members (those with project assignments)
        const userIdsFromTeam = teamData?.map(m => m.user_id).filter(Boolean) || [];

        // Get emails from accepted invitations for matching
        const inviteEmails = acceptedInvites?.map(i => i.email.toLowerCase()) || [];

        // First, add all accepted invitations as team members (with or without projects)
        if (acceptedInvites && acceptedInvites.length > 0) {
            // Build email to user_id map by looking up auth users
            for (const inv of acceptedInvites) {
                let userId = inv.accepted_by;

                // If accepted_by is not set, try to find user by email
                if (!userId) {
                    const { data: authUserData } = await adminSupabase.auth.admin.listUsers();
                    const matchedUser = authUserData?.users?.find(
                        u => u.email?.toLowerCase() === inv.email.toLowerCase()
                    );
                    userId = matchedUser?.id || null;
                }

                if (userId && !memberMap.has(userId)) {
                    // Get profile for this user
                    let profile = null;
                    const { data: profileData } = await adminSupabase
                        .from('profiles')
                        .select('id, full_name, email, avatar_url')
                        .eq('id', userId)
                        .single();

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
        teamData?.forEach(m => {
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

        // Fetch proper profiles for any legacy members
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
            projects: projects || [],
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
        const adminSupabase = createAdminClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, projectId, role, action } = await request.json();

        // Verify the project belongs to the current user
        const { data: project } = await adminSupabase
            .from('projects')
            .select('id, user_id')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single();

        if (!project) {
            return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
        }

        if (action === 'assign') {
            // Add team member to project
            const { error } = await adminSupabase
                .from('team_members')
                .upsert({
                    project_id: projectId,
                    user_id: userId,
                    role: role || 'editor',
                }, { onConflict: 'project_id,user_id' });

            if (error) {
                console.error('Error assigning member:', error);
                return NextResponse.json({ error: 'Failed to assign member' }, { status: 500 });
            }

            // Send email notification to the assigned user
            try {
                // Get project name
                const { data: projectData } = await adminSupabase
                    .from('projects')
                    .select('name')
                    .eq('id', projectId)
                    .single();

                // Get assigned user's email
                const { data: userData } = await adminSupabase.auth.admin.getUserById(userId);

                // Get owner's info
                const { data: ownerProfile } = await adminSupabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                if (userData?.user?.email && projectData?.name) {
                    // Get user's profile for their name
                    const { data: userProfile } = await adminSupabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', userId)
                        .single();

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
            const { error } = await adminSupabase
                .from('team_members')
                .delete()
                .eq('project_id', projectId)
                .eq('user_id', userId);

            if (error) {
                console.error('Error unassigning member:', error);
                return NextResponse.json({ error: 'Failed to unassign member' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Team assignment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
