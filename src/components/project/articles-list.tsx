'use client';

import { useState } from 'react';
import { FileText, Plus, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/helpers';
import { STATUS_LABELS, NODE_TYPE_LABELS } from '@/lib/utils/constants';
import type { ContentNode, Project } from '@/lib/types';
import type { UserRole } from '@/lib/utils/roles';
import { canEditContent } from '@/lib/utils/roles';
import Link from 'next/link';

interface ArticlesListProps {
    projectId: string;
    project: Project | null;
    userRole?: UserRole;
    initialArticles?: ContentNode[];
}

/**
 * Client Component: Articles list with server-fetched initial data
 * Receives initial articles from Server Component, can refetch if needed
 */
export function ArticlesList({ projectId, project, userRole = 'owner', initialArticles = [] }: ArticlesListProps) {
    const [nodes, setNodes] = useState<ContentNode[]>(initialArticles);
    const canEdit = canEditContent(userRole);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'writing': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'needs_update': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'pillar': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
            case 'cluster': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'supporting': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Articles</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {nodes.length} articles in this project
                        {project?.domain && (
                            <span className="ml-2 text-indigo-600 dark:text-indigo-400">• {project.domain}</span>
                        )}
                    </p>
                </div>
                {canEdit && (
                    <Link href={`/project/${projectId}/article/new`}>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            New Article
                        </Button>
                    </Link>
                )}
            </div>

            {/* Articles List */}
            {nodes.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No articles yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {canEdit ? 'Create your first article or add nodes on the Canvas' : 'No articles have been created yet'}
                    </p>
                    {canEdit && (
                        <Link href={`/project/${projectId}/article/new`}>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Article
                            </Button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Desktop Table View */}
                    <table className="w-full hidden md:table">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Article
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    URL Preview
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {nodes.map((node) => (
                                <tr
                                    key={node.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <Link href={`/project/${projectId}/article/${node.id}`} className="block">
                                            <div className="font-medium text-gray-900 dark:text-white">{node.title}</div>
                                            {node.target_keyword && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
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
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {project?.domain || 'domain.com'}/{node.slug || 'slug'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                        {nodes.map((node) => (
                            <Link
                                key={node.id}
                                href={`/project/${projectId}/article/${node.id}`}
                                className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 dark:text-white truncate">{node.title}</div>
                                        {node.target_keyword && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                                <Hash className="w-3 h-3" />
                                                <span className="truncate">{node.target_keyword}</span>
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                                            {project?.domain || 'domain.com'}/{node.slug || 'slug'}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 items-end shrink-0">
                                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getTypeColor(node.node_type))}>
                                            {NODE_TYPE_LABELS[node.node_type]}
                                        </span>
                                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(node.status))}>
                                            {STATUS_LABELS[node.status]}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
