import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/share/[shareId]
 * Fetch shared article data by share ID (public access, no auth required)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ shareId: string }> }
) {
    try {
        const { shareId } = await params;

        // Find node by share_id where is_public is true
        const node = await prisma.nodes.findFirst({
            where: {
                share_id: shareId,
                is_public: true,
            },
            select: {
                id: true,
                title: true,
                slug: true,
                target_keyword: true,
                status: true,
                node_type: true,
                created_at: true,
                assigned_to: true,
                project_id: true,
            },
        });

        if (!node) {
            return NextResponse.json(
                { error: 'Article not found or is no longer public' },
                { status: 404 }
            );
        }

        // Fetch article content
        const article = await prisma.articles.findFirst({
            where: { node_id: node.id },
            select: {
                content: true,
                word_count: true,
                seo_title: true,
                seo_description: true,
            },
        });

        // Fetch project info
        const project = await prisma.projects.findUnique({
            where: { id: node.project_id },
            select: {
                name: true,
                domain: true,
            },
        });

        return NextResponse.json({
            node,
            article,
            project,
        });
    } catch (error) {
        console.error('Error fetching shared article:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shared article' },
            { status: 500 }
        );
    }
}
