'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FolderOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectCard } from '@/components/dashboard/project-card';
import { CreateProjectModal } from '@/components/dashboard/create-project-modal';
import { DeleteProjectModal } from '@/components/dashboard/delete-project-modal';
import type { Project, CreateProjectInput } from '@/lib/types';

export default function DashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editProject, setEditProject] = useState<Project | null>(null);
    const [deleteProject, setDeleteProject] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch projects
    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async (input: CreateProjectInput) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('projects')
            .insert({
                ...input,
                user_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;
        setProjects((prev) => [data, ...prev]);
    };

    const handleUpdateProject = async (input: CreateProjectInput) => {
        if (!editProject) return;

        const supabase = createClient();
        const { data, error } = await supabase
            .from('projects')
            .update(input)
            .eq('id', editProject.id)
            .select()
            .single();

        if (error) throw error;
        setProjects((prev) => prev.map((p) => (p.id === editProject.id ? data : p)));
        setEditProject(null);
    };

    const handleDeleteProject = async () => {
        if (!deleteProject) return;

        setIsDeleting(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', deleteProject.id);

            if (error) throw error;
            setProjects((prev) => prev.filter((p) => p.id !== deleteProject.id));
            setDeleteProject(null);
        } catch (error) {
            console.error('Failed to delete project:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter projects by search
    const filteredProjects = projects.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-600 mt-1">Manage your content architecture projects</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                    New Project
                </Button>
            </div>

            {/* Search */}
            <div className="mb-6 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && projects.length === 0 && (
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
                        <FolderOpen className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">No projects yet</h2>
                    <p className="text-gray-600 mt-1 mb-6">Create your first project to start mapping content architecture</p>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Create First Project
                    </Button>
                </div>
            )}

            {/* No search results */}
            {!isLoading && projects.length > 0 && filteredProjects.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-gray-600">No projects found matching "{searchQuery}"</p>
                </div>
            )}

            {/* Projects grid */}
            {!isLoading && filteredProjects.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onEdit={setEditProject}
                            onDelete={setDeleteProject}
                        />
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <CreateProjectModal
                isOpen={isCreateModalOpen || !!editProject}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditProject(null);
                }}
                onSubmit={editProject ? handleUpdateProject : handleCreateProject}
                editProject={editProject}
            />

            {/* Delete Modal */}
            <DeleteProjectModal
                isOpen={!!deleteProject}
                onClose={() => setDeleteProject(null)}
                onConfirm={handleDeleteProject}
                project={deleteProject}
                isLoading={isDeleting}
            />
        </div>
    );
}
