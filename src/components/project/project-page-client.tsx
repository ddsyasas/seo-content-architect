'use client';

import { useState, useEffect } from 'react';
import { ProjectTabs } from '@/components/project/project-tabs';
import { ArticlesList } from '@/components/project/articles-list';
import { CanvasEditor } from '@/components/canvas/canvas-editor';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/lib/types';
import type { UserRole } from '@/lib/utils/roles';

interface ProjectPageClientProps {
    projectId: string;
}

export function ProjectPageClient({ projectId }: ProjectPageClientProps) {
    const [activeTab, setActiveTab] = useState<'articles' | 'canvas'>('articles');
    const [project, setProject] = useState<Project | null>(null);
    const [userRole, setUserRole] = useState<UserRole>('viewer');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const loadProject = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setIsLoading(false);
            return;
        }

        // Load project
        const { data: projectData } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        setProject(projectData);

        // Check if user is owner
        if (projectData?.user_id === user.id) {
            setUserRole('owner');
        } else {
            // Check team_members for role
            const { data: membership } = await supabase
                .from('team_members')
                .select('role')
                .eq('project_id', projectId)
                .eq('user_id', user.id)
                .single();

            if (membership) {
                setUserRole(membership.role as UserRole);
            }
        }

        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
            </div>
        );
    }

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
                        <ArticlesList projectId={projectId} project={project} userRole={userRole} />
                    </div>
                ) : (
                    <CanvasEditor projectId={projectId} userRole={userRole} />
                )}
            </div>
        </div>
    );
}
