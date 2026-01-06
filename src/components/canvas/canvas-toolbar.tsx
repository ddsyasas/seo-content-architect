'use client';

import { Plus, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/helpers';
import { NODE_TYPE_LABELS } from '@/lib/utils/constants';
import type { NodeType } from '@/lib/types';

interface CanvasToolbarProps {
    onAddNode: (type: NodeType) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitView: () => void;
    zoom: number;
}

export function CanvasToolbar({
    onAddNode,
    onZoomIn,
    onZoomOut,
    onFitView,
    zoom
}: CanvasToolbarProps) {
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

    const nodeTypes: { type: NodeType; color: string }[] = [
        { type: 'pillar', color: 'bg-indigo-500' },
        { type: 'cluster', color: 'bg-blue-500' },
        { type: 'planned', color: 'bg-gray-400' },
        { type: 'external', color: 'bg-green-500' },
    ];

    return (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            {/* Add Node Dropdown */}
            <div className="relative">
                <Button
                    onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                    className="gap-1.5"
                >
                    <Plus className="w-4 h-4" />
                    Add Node
                    <ChevronDown className={cn(
                        'w-4 h-4 transition-transform',
                        isAddMenuOpen && 'rotate-180'
                    )} />
                </Button>

                {isAddMenuOpen && (
                    <>
                        <div className="fixed inset-0" onClick={() => setIsAddMenuOpen(false)} />
                        <div className="absolute left-0 top-full mt-2 w-48 py-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                            {nodeTypes.map(({ type, color }) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        onAddNode(type);
                                        setIsAddMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <span className={cn('w-3 h-3 rounded', color)} />
                                    {NODE_TYPE_LABELS[type]}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
                <button
                    onClick={onZoomOut}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-50 border-r border-gray-200"
                >
                    −
                </button>
                <span className="px-3 py-2 text-sm text-gray-700 min-w-[60px] text-center">
                    {Math.round(zoom * 100)}%
                </span>
                <button
                    onClick={onZoomIn}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-50 border-l border-gray-200"
                >
                    +
                </button>
            </div>

            {/* Fit View */}
            <Button variant="outline" onClick={onFitView} size="sm">
                Fit
            </Button>
        </div>
    );
}
