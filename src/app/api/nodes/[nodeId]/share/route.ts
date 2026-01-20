import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/nodes/[nodeId]/share
 * Toggle public sharing for a node (article)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ nodeId: string }> }
) {
    try {
        const { nodeId } = await params;
        const supabase = await createClient();

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { isPublic } = body as { isPublic: boolean };

        // Get the node to verify ownership
        const node = await prisma.nodes.findUnique({
            where: { id: nodeId },
            select: { project_id: true, share_id: true },
        });

        if (!node) {
            return NextResponse.json({ error: 'Node not found' }, { status: 404 });
        }

        // Verify user has access to the project (owner or team member)
        const project = await prisma.projects.findUnique({
            where: { id: node.project_id },
            select: { user_id: true },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Check if user is owner or team member
        const isOwner = project.user_id === user.id;
        const isMember = await prisma.team_members.findFirst({
            where: {
                project_id: node.project_id,
                user_id: user.id,
            },
        });

        if (!isOwner && !isMember) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // If share_id is null and we're enabling sharing, generate a new UUID
        const updateData: { is_public: boolean; share_id?: string } = { is_public: isPublic };
        if (!node.share_id && isPublic) {
            updateData.share_id = crypto.randomUUID();
        }

        const updatedNode = await prisma.nodes.update({
            where: { id: nodeId },
            data: updateData,
            select: { is_public: true, share_id: true },
        });

        return NextResponse.json({
            success: true,
            isPublic: updatedNode.is_public,
            shareId: updatedNode.share_id,
        });
    } catch (error) {
        console.error('Error toggling share status:', error);
        return NextResponse.json(
            { error: 'Failed to update share status' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/nodes/[nodeId]/share
 * Get share status for a node
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ nodeId: string }> }
) {
    try {
        const { nodeId } = await params;
        const supabase = await createClient();

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const node = await prisma.nodes.findUnique({
            where: { id: nodeId },
            select: { is_public: true, share_id: true },
        });

        if (!node) {
            return NextResponse.json({ error: 'Node not found' }, { status: 404 });
        }

        return NextResponse.json({
            isPublic: node.is_public,
            shareId: node.share_id,
        });
    } catch (error) {
        console.error('Error getting share status:', error);
        return NextResponse.json(
            { error: 'Failed to get share status' },
            { status: 500 }
        );
    }
}
