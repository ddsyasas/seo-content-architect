'use client';

import { Plus, ChevronDown, Undo2, Redo2, Download, Image, FileSpreadsheet } from 'lucide-react';
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
    onUndo?: () => void;
    onRedo?: () => void;
    onExportPNG?: () => void;
    onExportCSV?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    zoom: number;
    canEdit?: boolean;
}

export function CanvasToolbar({
    onAddNode,
    onZoomIn,
    onZoomOut,
    onFitView,
    onUndo,
    onRedo,
    onExportPNG,
    onExportCSV,
    canUndo = false,
    canRedo = false,
    zoom,
    canEdit = true
}: CanvasToolbarProps) {
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    const nodeTypes: { type: NodeType; color: string }[] = [
        { type: 'pillar', color: 'bg-indigo-500' },
        { type: 'cluster', color: 'bg-blue-500' },
        { type: 'supporting', color: 'bg-cyan-500' },
        { type: 'planned', color: 'bg-gray-400' },
        { type: 'external', color: 'bg-green-500' },
    ];

    return (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            {/* Add Node Dropdown - Only show for editors */}
            {canEdit && (
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
                            <div className="absolute left-0 top-full mt-2 w-48 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                {nodeTypes.map(({ type, color }) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            onAddNode(type);
                                            setIsAddMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <span className={cn('w-3 h-3 rounded', color)} />
                                        {NODE_TYPE_LABELS[type]}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Undo/Redo Buttons - Only show for editors */}
            {canEdit && (
                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-l-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-600" />
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-r-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <Redo2 className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <button
                    onClick={onZoomOut}
                    className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-600"
                >
                    −
                </button>
                <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
                    {Math.round(zoom * 100)}%
                </span>
                <button
                    onClick={onZoomIn}
                    className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-l border-gray-200 dark:border-gray-600"
                >
                    +
                </button>
            </div>

            {/* Fit View */}
            <Button variant="outline" onClick={onFitView} size="sm">
                Fit
            </Button>

            {/* Export Dropdown */}
            <div className="relative">
                <Button
                    variant="outline"
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    size="sm"
                    className="gap-1.5"
                >
                    <Download className="w-4 h-4" />
                    Export
                    <ChevronDown className={cn(
                        'w-3 h-3 transition-transform',
                        isExportMenuOpen && 'rotate-180'
                    )} />
                </Button>

                {isExportMenuOpen && (
                    <>
                        <div className="fixed inset-0" onClick={() => setIsExportMenuOpen(false)} />
                        <div className="absolute left-0 top-full mt-2 w-40 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                            <button
                                onClick={() => {
                                    onExportPNG?.();
                                    setIsExportMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <Image className="w-4 h-4" />
                                Export as PNG
                            </button>
                            <button
                                onClick={() => {
                                    onExportCSV?.();
                                    setIsExportMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Export as CSV
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

