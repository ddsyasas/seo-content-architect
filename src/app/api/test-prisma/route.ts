import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/test-prisma - Test Prisma connection in Next.js context
export async function GET() {
  try {
    // Test 1: Count profiles
    const profileCount = await prisma.profiles.count();

    // Test 2: Count projects
    const projectCount = await prisma.projects.count();

    // Test 3: Get recent projects
    const recentProjects = await prisma.projects.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Test 4: Count nodes and articles
    const nodeCount = await prisma.nodes.count();
    const articleCount = await prisma.articles.count();

    return NextResponse.json({
      success: true,
      message: 'Prisma is working in Next.js!',
      data: {
        profiles: profileCount,
        projects: projectCount,
        nodes: nodeCount,
        articles: articleCount,
        recentProjects,
      },
    });
  } catch (error) {
    console.error('Prisma test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
