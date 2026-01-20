'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProjectTabs } from '@/components/project/project-tabs';
import { ArticlesList } from '@/components/project/articles-list';
import { CanvasEditor } from '@/components/canvas/canvas-editor';
import type { Project, ContentNode } from '@/lib/types';
import type { UserRole } from '@/lib/utils/roles';

interface ProjectPageClientProps {
    projectId: string;
    initialProject: Project;
    initialUserRole: UserRole;
    initialArticles: ContentNode[];
}

/**
 * Client Component: Handles project page interactivity
 * - Tab switching
 * - URL parameter handling
 * Receives project data and user role from Server Component
 */
export function ProjectPageClient({ projectId, initialProject, initialUserRole, initialArticles }: ProjectPageClientProps) {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'articles' | 'canvas'>('articles');
    const [project] = useState<Project>(initialProject);
    const [userRole] = useState<UserRole>(initialUserRole);
    const [articles] = useState<ContentNode[]>(initialArticles);

    // Handle tab from URL after mount to avoid hydration issues
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'canvas') {
            setActiveTab('canvas');
        }
    }, [searchParams]);

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] -m-6">
            {/* Tabs */}
            <ProjectTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                userRole={userRole}
            />

            {/* Content */}
            <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
                {activeTab === 'articles' ? (
                    <div className="h-full overflow-y-auto">
                        <ArticlesList projectId={projectId} project={project} userRole={userRole} initialArticles={articles} />
                    </div>
                ) : (
                    <CanvasEditor projectId={projectId} userRole={userRole} projectDomain={project.domain || undefined} />
                )}
            </div>
        </div>
    );
}
