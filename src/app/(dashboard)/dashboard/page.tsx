'use client';

import { useState, useEffect } from 'react';
import { FileText, Layers, FolderOpen, TrendingUp, ArrowUpRight, Clock } from 'lucide-react';
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
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            // Fetch owned projects
            const { data: ownedProjects } = await supabase
                .from('projects')
                .select('id, name, color, updated_at')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            // Fetch team projects
            const { data: teamMemberships } = await supabase
                .from('team_members')
                .select('project_id')
                .eq('user_id', user.id);

            const teamProjectIds = teamMemberships?.map(m => m.project_id) || [];

            let teamProjects: any[] = [];
            if (teamProjectIds.length > 0) {
                const { data } = await supabase
                    .from('projects')
                    .select('id, name, color, updated_at')
                    .in('id', teamProjectIds);
                teamProjects = data || [];
            }

            const allProjects = [...(ownedProjects || []), ...teamProjects];
            const projectIds = allProjects.map(p => p.id);

            // Fetch counts
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
            const recentProjects = [];
            for (const project of allProjects.slice(0, 3)) {
                const { count: nodeCount } = await supabase
                    .from('nodes')
                    .select('*', { count: 'exact', head: true })
                    .eq('project_id', project.id);

                const { count: articleCount } = await supabase
                    .from('articles')
                    .select('*', { count: 'exact', head: true })
                    .eq('project_id', project.id);

                recentProjects.push({
                    ...project,
                    nodeCount: nodeCount || 0,
                    articleCount: articleCount || 0,
                });
            }

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
                    <div className="h-8 bg-gray-200 rounded w-48"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-32 bg-gray-200 rounded-xl"></div>
                        <div className="h-32 bg-gray-200 rounded-xl"></div>
                        <div className="h-32 bg-gray-200 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Overview of your SEO content projects</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Projects</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalProjects}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <FolderOpen className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                    <Link
                        href="/projects"
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 font-medium mt-4 hover:text-indigo-700"
                    >
                        View all projects
                        <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Articles</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalArticles}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Across all your projects</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Nodes</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalNodes}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Layers className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Content items planned</p>
                </Card>
            </div>

            {/* Recent Projects */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
                    <Link
                        href="/projects"
                        className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
                    >
                        View all
                    </Link>
                </div>

                {stats.recentProjects.length === 0 ? (
                    <Card className="p-8 text-center">
                        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No projects yet</p>
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-2 text-indigo-600 font-medium mt-2 hover:text-indigo-700"
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
                                            <h3 className="font-medium text-gray-900 truncate">
                                                {project.name}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span>{project.nodeCount} nodes</span>
                                                <span>{project.articleCount} articles</span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
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
