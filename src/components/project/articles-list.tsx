'use client';

import { useEffect, useState } from 'react';
import { FileText, Plus, Clock, Hash } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/helpers';
import { STATUS_LABELS, NODE_TYPE_LABELS } from '@/lib/utils/constants';
import type { ContentNode, Project } from '@/lib/types';
import Link from 'next/link';

interface ArticlesListProps {
    projectId: string;
    project: Project | null;
}

interface ArticleWithNode extends ContentNode {
    word_count?: number;
}

export function ArticlesList({ projectId, project }: ArticlesListProps) {
    const [nodes, setNodes] = useState<ArticleWithNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadArticles();
    }, [projectId]);

    const loadArticles = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('nodes')
            .select('*')
            .eq('project_id', projectId)
            .neq('node_type', 'external')
            .order('created_at', { ascending: false });

        setNodes(data || []);
        setIsLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-green-100 text-green-700';
            case 'writing': return 'bg-amber-100 text-amber-700';
            case 'needs_update': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'pillar': return 'bg-indigo-100 text-indigo-700';
            case 'cluster': return 'bg-blue-100 text-blue-700';
            case 'supporting': return 'bg-cyan-100 text-cyan-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Articles</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {nodes.length} articles in this project
                        {project?.domain && (
                            <span className="ml-2 text-indigo-600">• {project.domain}</span>
                        )}
                    </p>
                </div>
                <Link href={`/project/${projectId}/article/new`}>
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Article
                    </Button>
                </Link>
            </div>

            {/* Articles List */}
            {nodes.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
                    <p className="text-gray-500 mb-6">
                        Create your first article or add nodes on the Canvas
                    </p>
                    <Link href={`/project/${projectId}/article/new`}>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Article
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Article
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    URL Preview
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {nodes.map((node) => (
                                <tr
                                    key={node.id}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <Link href={`/project/${projectId}/article/${node.id}`} className="block">
                                            <div className="font-medium text-gray-900">{node.title}</div>
                                            {node.target_keyword && (
                                                <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                    <Hash className="w-3 h-3" />
                                                    {node.target_keyword}
                                                </div>
                                            )}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getTypeColor(node.node_type))}>
                                            {NODE_TYPE_LABELS[node.node_type]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(node.status))}>
                                            {STATUS_LABELS[node.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-500">
                                            {project?.domain || 'domain.com'}/{node.slug || 'slug'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
