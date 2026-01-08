import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    checkProjectLimit,
    checkArticleLimit,
    checkNodeLimit,
    checkTeamLimit,
    getUserLimitsAndUsage,
    canCreateProjects
} from '@/lib/utils/limit-checker';

// GET /api/limits - Get current user's limits and usage
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const limitsAndUsage = await getUserLimitsAndUsage(user.id);
        const canCreate = await canCreateProjects(user.id);

        return NextResponse.json({
            ...limitsAndUsage,
            canCreateProjects: canCreate,
        });
    } catch (error) {
        console.error('Error getting limits:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/limits/check - Check a specific limit
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, projectId } = await request.json();

        let result;
        switch (type) {
            case 'project':
                result = await checkProjectLimit(user.id);
                break;
            case 'article':
                if (!projectId) {
                    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
                }
                result = await checkArticleLimit(projectId);
                break;
            case 'node':
                if (!projectId) {
                    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
                }
                result = await checkNodeLimit(projectId);
                break;
            case 'team':
                result = await checkTeamLimit(user.id);
                break;
            default:
                return NextResponse.json({ error: 'Invalid limit type' }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error checking limit:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
