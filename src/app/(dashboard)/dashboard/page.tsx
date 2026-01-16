'use client';

import { useState, useEffect } from 'react';
import { FileText, Layers, FolderOpen, ArrowUpRight, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils/helpers';

interface DashboardStats {
    totalProjects: number;
    totalArticles: number;
    totalNodes: number;
    recentProjects: Array<{
        id: string;
        name: string;
        color: string;
        updated_at: string;
        nodeCount: number;
        articleCount: number;
    }>;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalProjects: 0,
        totalArticles: 0,
        totalNodes: 0,
        recentProjects: [],
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Use the same API as projects page for consistent data
            const response = await fetch('/api/projects');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            const allProjects = data.projects || [];
            const projectIds = allProjects.map((p: any) => p.id);

            // Fetch counts using supabase for articles and nodes
            const supabase = createClient();
            let totalArticles = 0;
            let totalNodes = 0;

            if (projectIds.length > 0) {
                const { count: articleCount } = await supabase
                    .from('articles')
                    .select('*', { count: 'exact', head: true })
                    .in('project_id', projectIds);
                totalArticles = articleCount || 0;

                const { count: nodeCount } = await supabase
                    .from('nodes')
                    .select('*', { count: 'exact', head: true })
                    .in('project_id', projectIds);
                totalNodes = nodeCount || 0;
            }

            // Get recent projects with their counts
            const recentProjects = allProjects.slice(0, 3).map((project: any) => ({
                id: project.id,
                name: project.name,
                color: project.color,
                updated_at: project.updated_at,
                nodeCount: project.nodeCount || 0,
                articleCount: project.articleCount || 0,
            }));

            setStats({
                totalProjects: allProjects.length,
                totalArticles,
                totalNodes,
                recentProjects,
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of your SEO content projects</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Projects</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalProjects}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                            <FolderOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                    <Link
                        href="/projects"
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-4 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                        View all projects
                        <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Articles</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalArticles}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Across all your projects</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Nodes</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalNodes}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                            <Layers className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Content items planned</p>
                </Card>
            </div>

            {/* Recent Projects */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Projects</h2>
                    <Link
                        href="/projects"
                        className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                        View all
                    </Link>
                </div>

                {stats.recentProjects.length === 0 ? (
                    <Card className="p-8 text-center">
                        <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No projects yet</p>
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium mt-2 hover:text-indigo-700 dark:hover:text-indigo-300"
                        >
                            Create your first project
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {stats.recentProjects.map((project) => (
                            <Link key={project.id} href={`/project/${project.id}`}>
                                <Card hover className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: project.color + '20' }}
                                        >
                                            <FolderOpen
                                                className="w-5 h-5"
                                                style={{ color: project.color }}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                {project.name}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                <span>{project.nodeCount} nodes</span>
                                                <span>{project.articleCount} articles</span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 dark:text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                {formatRelativeTime(project.updated_at)}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
