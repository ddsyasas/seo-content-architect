'use client';

import { useRouter } from 'next/navigation';
import { MoreVertical, Calendar, FileText, Trash2, Edit, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils/helpers';
import type { Project } from '@/lib/types';

interface ProjectCardProps {
    project: Project;
    nodeCount?: number;
    onEdit: (project: Project) => void;
    onDelete: (project: Project) => void;
}

export function ProjectCard({ project, nodeCount = 0, onEdit, onDelete }: ProjectCardProps) {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleOpen = () => {
        router.push(`/project/${project.id}`);
    };

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
                            className="font-semibold text-gray-900 truncate cursor-pointer hover:text-indigo-600"
                            onClick={handleOpen}
                        >
                            {project.name}
                        </h3>
                        {project.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                        )}
                    </div>

                    {/* Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0" onClick={() => setIsMenuOpen(false)} />
                                <div className="absolute right-0 top-8 w-40 py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onEdit(project);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onDelete(project);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {nodeCount} nodes
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
