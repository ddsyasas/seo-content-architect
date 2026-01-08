import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { isSuperAdminServer } from '@/lib/utils/admin';

// Create a Supabase admin client for privileged operations
function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

// Create a Supabase client for auth checks
async function getSupabaseAuth() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
            },
        }
    );
}

export async function GET(request: NextRequest) {
    try {
        // Get authenticated user
        const supabase = await getSupabaseAuth();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !isSuperAdminServer(user.email)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Use admin client to fetch all users
        const supabaseAdmin = getSupabaseAdmin();

        // Get all profiles with their data
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            throw profilesError;
        }

        // Get project counts per user
        const { data: projectCounts } = await supabaseAdmin
            .from('projects')
            .select('user_id');

        // Get subscription data
        const { data: subscriptions } = await supabaseAdmin
            .from('subscriptions')
            .select('user_id, plan, status, current_period_end');

        // Aggregate data
        const projectCountMap: Record<string, number> = {};
        projectCounts?.forEach(p => {
            projectCountMap[p.user_id] = (projectCountMap[p.user_id] || 0) + 1;
        });

        const subscriptionMap: Record<string, any> = {};
        subscriptions?.forEach(s => {
            subscriptionMap[s.user_id] = {
                plan: s.plan,
                status: s.status,
                currentPeriodEnd: s.current_period_end,
            };
        });

        // Combine data
        const users = profiles?.map(profile => ({
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
            projectCount: projectCountMap[profile.id] || 0,
            subscription: subscriptionMap[profile.id] || { plan: 'free', status: 'active' },
        })) || [];

        // Calculate stats
        const stats = {
            totalUsers: users.length,
            totalProjects: Object.values(projectCountMap).reduce((a, b) => a + b, 0),
            subscriptionBreakdown: {
                free: users.filter(u => !u.subscription.plan || u.subscription.plan === 'free').length,
                pro: users.filter(u => u.subscription.plan === 'pro').length,
                agency: users.filter(u => u.subscription.plan === 'agency').length,
            },
        };

        return NextResponse.json({ users, stats });
    } catch (error) {
        console.error('Admin users API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Get authenticated user
        const supabase = await getSupabaseAuth();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !isSuperAdminServer(user.email)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Prevent deleting yourself
        if (userId === user.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Delete user's projects first (cascade will handle nodes, edges, articles)
        await supabaseAdmin
            .from('projects')
            .delete()
            .eq('user_id', userId);

        // Delete team memberships
        await supabaseAdmin
            .from('team_members')
            .delete()
            .eq('user_id', userId);

        // Delete subscription
        await supabaseAdmin
            .from('subscriptions')
            .delete()
            .eq('user_id', userId);

        // Delete profile
        await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);

        // Delete auth user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error('Error deleting auth user:', deleteError);
            throw deleteError;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin delete user error:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
