'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileText, Clock, Edit3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/helpers';

interface PlannedNodeData {
    nodeId: string;
    projectId: string;
    title: string;
    target_keyword: string | null;
}

function PlannedNode({ data, selected }: NodeProps<PlannedNodeData>) {
    const router = useRouter();

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/project/${data.projectId}/article/${data.nodeId}`);
    };

    return (
        <div
            className={cn(
                'px-4 py-3 rounded-lg border-2 border-dashed border-gray-400 bg-gray-50',
                'min-w-[180px] max-w-[240px]',
                'shadow-sm transition-shadow',
                selected && 'ring-2 ring-gray-500 ring-offset-2'
            )}
        >
            {/* Connection handles - 4 handles, one per side */}
            <Handle type="source" position={Position.Top} id="top" className="w-3 h-3 !bg-gray-400 border-2 border-white" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="w-3 h-3 !bg-gray-400 border-2 border-white" />
            <Handle type="source" position={Position.Left} id="left" className="w-3 h-3 !bg-gray-400 border-2 border-white" />
            <Handle type="source" position={Position.Right} id="right" className="w-3 h-3 !bg-gray-400 border-2 border-white" />

            {/* Status badge */}
            <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">
                    Planned
                </span>
            </div>

            {/* Title */}
            <h3 className="font-medium text-gray-700 text-sm leading-tight mb-2">
                {data.title}
            </h3>

            {/* Keyword and Edit button */}
            <div className="flex items-center justify-between">
                {data.target_keyword && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <FileText className="w-3 h-3" />
                        <span className="truncate">{data.target_keyword}</span>
                    </div>
                )}
                <button
                    onClick={handleEditClick}
                    className="p-1 rounded hover:bg-gray-200 text-gray-600 transition-colors ml-auto"
                    title="Edit Article"
                >
                    <Edit3 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

export default memo(PlannedNode);
