'use client';

import { cn } from '@/lib/utils/helpers';
import { FileText, Network, Eye } from 'lucide-react';
import type { UserRole } from '@/lib/utils/roles';
import { canEditContent } from '@/lib/utils/roles';

interface ProjectTabsProps {
    activeTab: 'articles' | 'canvas';
    onTabChange: (tab: 'articles' | 'canvas') => void;
    userRole?: UserRole;
}

export function ProjectTabs({ activeTab, onTabChange, userRole = 'owner' }: ProjectTabsProps) {
    const tabs = [
        { id: 'articles' as const, label: 'Articles', icon: FileText },
        { id: 'canvas' as const, label: 'Canvas', icon: Network },
    ];

    const isViewer = !canEditContent(userRole);

    return (
        <div className="border-b border-gray-200 bg-white">
            <nav className="flex items-center justify-between px-6" aria-label="Project tabs">
                <div className="flex gap-4">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => onTabChange(id)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                                activeTab === id
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {isViewer && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                        <Eye className="w-4 h-4" />
                        View Only
                    </span>
                )}
            </nav>
        </div>
    );
}

