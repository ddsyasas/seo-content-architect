'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileText, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

interface PlannedNodeData {
    title: string;
    target_keyword: string | null;
}

function PlannedNode({ data, selected }: NodeProps<PlannedNodeData>) {
    return (
        <div
            className={cn(
                'px-4 py-3 rounded-lg border-2 border-dashed border-gray-400 bg-gray-50',
                'min-w-[180px] max-w-[240px]',
                'shadow-sm transition-shadow',
                selected && 'ring-2 ring-gray-500 ring-offset-2'
            )}
        >
            {/* Connection handles */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-gray-400 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-gray-400 border-2 border-white"
            />

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

            {/* Keyword */}
            {data.target_keyword && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <FileText className="w-3 h-3" />
                    <span className="truncate">{data.target_keyword}</span>
                </div>
            )}
        </div>
    );
}

export default memo(PlannedNode);
