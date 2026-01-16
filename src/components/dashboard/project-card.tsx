'use client';

import { useRouter } from 'next/navigation';
import { MoreVertical, Calendar, FileText, Trash2, Edit, ExternalLink, Users, Layers } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils/helpers';
import type { Project } from '@/lib/types';

interface ProjectCardProps {
    project: Project & {
        accessType?: 'owner' | 'team_member';
        role?: string;
        nodeCount?: number;
        articleCount?: number;
    };
    onEdit: (project: Project) => void;
    onDelete: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleOpen = () => {
        router.push(`/project/${project.id}`);
    };

    const isOwner = project.accessType !== 'team_member';
    const canEdit = isOwner || project.role === 'editor';

    return (
        <Card hover className="overflow-hidden group">
            {/* Preview area with project color accent */}
            <div
                className="h-32 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${project.color}20 0%, ${project.color}10 100%)` }}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: project.color }}
                    >
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                </div>

                {/* Team member badge */}
                {!isOwner && (
                    <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                        <Users className="w-3 h-3" />
                        {project.role === 'editor' ? 'Editor' : 'Viewer'}
                    </div>
                )}

                {/* Quick action on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button onClick={handleOpen} size="sm" className="shadow-lg">
                        <ExternalLink className="w-4 h-4" />
                        Open Canvas
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h3
                            className="font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                            onClick={handleOpen}
                        >
                            {project.name}
                        </h3>
                        {project.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                        )}
                    </div>

                    {/* Menu - for owners and editors */}
                    {canEdit && (
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                                <>
                                    <div className="fixed inset-0" onClick={() => setIsMenuOpen(false)} />
                                    <div className="absolute right-0 top-8 w-40 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                onEdit(project);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                        {isOwner && (
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    onDelete(project);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {project.nodeCount || 0} nodes
                    </span>
                    <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {project.articleCount || 0} articles
                    </span>
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatRelativeTime(project.updated_at)}
                    </span>
                </div>
            </div>
        </Card>
    );
}
