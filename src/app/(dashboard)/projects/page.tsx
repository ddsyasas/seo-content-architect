'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FolderOpen, AlertCircle, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/dashboard/project-card';
import { CreateProjectModal } from '@/components/dashboard/create-project-modal';
import { DeleteProjectModal } from '@/components/dashboard/delete-project-modal';
import type { Project, CreateProjectInput } from '@/lib/types';
import Link from 'next/link';

interface LimitsData {
    plan: string;
    limits: {
        projects: number;
        articlesPerProject: number;
        nodesPerProject: number;
        teamMembersPerProject: number;
    };
    usage: {
        projects: number;
        teamMembers: number;
    };
    canCreateProjects: boolean;
}

export default function DashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editProject, setEditProject] = useState<Project | null>(null);
    const [deleteProject, setDeleteProject] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [limits, setLimits] = useState<LimitsData | null>(null);

    // Fetch projects and limits
    useEffect(() => {
        fetchProjects();
        fetchLimits();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);
            setProjects(data.projects || []);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLimits = async () => {
        try {
            const response = await fetch('/api/limits');
            const data = await response.json();
            if (response.ok) {
                setLimits(data);
            }
        } catch (error) {
            console.error('Failed to fetch limits:', error);
        }
    };

    const handleCreateProject = async (input: CreateProjectInput) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Not authenticated');

        // Check project limit before creating
        const limitCheck = await fetch('/api/limits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'project' })
        }).then(r => r.json());

        if (!limitCheck.allowed) {
            throw new Error(limitCheck.message || `You've reached your project limit (${limitCheck.limit}). Upgrade your plan to create more projects.`);
        }

        const { data, error } = await supabase
            .from('projects')
            .insert({
                ...input,
                user_id: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('[Dashboard] Project creation error:', error);
            throw new Error(error.message || 'Failed to create project');
        }
        setProjects((prev) => [{ ...data, accessType: 'owner', role: 'owner', nodeCount: 0, articleCount: 0 }, ...prev]);
        fetchLimits(); // Refresh limits
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
        setProjects((prev) => prev.map((p) => (p.id === editProject.id ? { ...p, ...data } : p)));
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
            fetchLimits(); // Refresh limits
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

    // Count owned projects
    const ownedProjects = projects.filter((p: any) => p.accessType === 'owner');
    const isAtProjectLimit = limits ? ownedProjects.length >= limits.limits.projects : false;
    const canCreate = limits?.canCreateProjects && !isAtProjectLimit;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {limits && (
                            <span>
                                {ownedProjects.length} of {limits.limits.projects >= 999999 ? '∞' : limits.limits.projects} projects
                            </span>
                        )}
                    </p>
                </div>

                {canCreate ? (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        New Project
                    </Button>
                ) : isAtProjectLimit ? (
                    <Link href="/settings/subscription">
                        <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                            <Crown className="w-4 h-4" />
                            Upgrade to Create More
                        </Button>
                    </Link>
                ) : !limits?.canCreateProjects ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Team members can't create projects
                    </div>
                ) : null}
            </div>

            {/* Limit Warning */}
            {isAtProjectLimit && limits && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-800 dark:text-amber-300">Project limit reached</p>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                            Your {limits.plan} plan allows {limits.limits.projects} project{limits.limits.projects > 1 ? 's' : ''}.{' '}
                            <Link href="/settings/subscription" className="underline font-medium">Upgrade your plan</Link> to create more.
                        </p>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="mb-6 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && projects.length === 0 && (
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
                        <FolderOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No projects yet</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 mb-6">Create your first project to start mapping content architecture</p>
                    {canCreate && (
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="w-4 h-4" />
                            Create First Project
                        </Button>
                    )}
                </div>
            )}

            {/* No search results */}
            {!isLoading && projects.length > 0 && filteredProjects.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-gray-600 dark:text-gray-400">No projects found matching "{searchQuery}"</p>
                </div>
            )}

            {/* Projects grid */}
            {!isLoading && filteredProjects.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project as any}
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

