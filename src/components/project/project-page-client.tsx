'use client';

import { useState, useEffect } from 'react';
import { ProjectTabs } from '@/components/project/project-tabs';
import { ArticlesList } from '@/components/project/articles-list';
import { CanvasEditor } from '@/components/canvas/canvas-editor';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/lib/types';

interface ProjectPageClientProps {
    projectId: string;
}

export function ProjectPageClient({ projectId }: ProjectPageClientProps) {
    const [activeTab, setActiveTab] = useState<'articles' | 'canvas'>('canvas');
    const [project, setProject] = useState<Project | null>(null);

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const loadProject = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        setProject(data);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] -m-6">
            {/* Tabs */}
            <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Content */}
            <div className="flex-1 overflow-hidden bg-gray-50">
                {activeTab === 'articles' ? (
                    <div className="h-full overflow-y-auto">
                        <ArticlesList projectId={projectId} project={project} />
                    </div>
                ) : (
                    <CanvasEditor projectId={projectId} />
                )}
            </div>
        </div>
    );
}
