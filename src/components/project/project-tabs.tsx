'use client';

import { cn } from '@/lib/utils/helpers';
import { FileText, Network } from 'lucide-react';

interface ProjectTabsProps {
    activeTab: 'articles' | 'canvas';
    onTabChange: (tab: 'articles' | 'canvas') => void;
}

export function ProjectTabs({ activeTab, onTabChange }: ProjectTabsProps) {
    const tabs = [
        { id: 'articles' as const, label: 'Articles', icon: FileText },
        { id: 'canvas' as const, label: 'Canvas', icon: Network },
    ];

    return (
        <div className="border-b border-gray-200 bg-white">
            <nav className="flex gap-4 px-6" aria-label="Project tabs">
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
            </nav>
        </div>
    );
}
