'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileText, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { STATUS_LABELS } from '@/lib/utils/constants';
import type { NodeStatus } from '@/lib/types';

interface SupportingNodeData {
    title: string;
    target_keyword: string | null;
    status: NodeStatus;
    incomingLinks?: number;
    outgoingLinks?: number;
}

const statusStyles: Record<NodeStatus, string> = {
    planned: 'border-dashed border-gray-400 bg-gray-50',
    writing: 'border-solid border-amber-400 bg-amber-50',
    published: 'border-solid border-cyan-500 bg-cyan-50',
    needs_update: 'border-solid border-orange-400 bg-orange-50',
};

const statusDotColors: Record<NodeStatus, string> = {
    planned: 'bg-gray-400',
    writing: 'bg-amber-400',
    published: 'bg-cyan-500',
    needs_update: 'bg-orange-400',
};

function SupportingNode({ data, selected }: NodeProps<SupportingNodeData>) {
    return (
        <div
            className={cn(
                'px-3 py-2 rounded-lg border min-w-[160px] max-w-[200px]',
                'shadow-sm transition-shadow',
                statusStyles[data.status],
                selected && 'ring-2 ring-cyan-500 ring-offset-2'
            )}
        >
            {/* Connection handles - 4 handles, one per side */}
            <Handle type="source" position={Position.Top} id="top" className="w-2.5 h-2.5 !bg-cyan-500 border-2 border-white" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="w-2.5 h-2.5 !bg-cyan-500 border-2 border-white" />
            <Handle type="source" position={Position.Left} id="left" className="w-2.5 h-2.5 !bg-cyan-500 border-2 border-white" />
            <Handle type="source" position={Position.Right} id="right" className="w-2.5 h-2.5 !bg-cyan-500 border-2 border-white" />

            {/* Status badge */}
            <div className="flex items-center gap-1.5 mb-1.5">
                <span className={cn('w-1.5 h-1.5 rounded-full', statusDotColors[data.status])} />
                <span className="text-[10px] font-medium text-cyan-700">
                    {STATUS_LABELS[data.status]}
                </span>
            </div>

            {/* Title */}
            <h3 className="font-medium text-gray-900 text-xs leading-tight mb-1.5">
                {data.title}
            </h3>

            {/* Keyword */}
            {data.target_keyword && (
                <div className="flex items-center gap-1 text-[10px] text-gray-600 mb-1.5">
                    <FileText className="w-2.5 h-2.5" />
                    <span className="truncate">{data.target_keyword}</span>
                </div>
            )}

            {/* Link counts */}
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span className="flex items-center gap-0.5">
                    <LinkIcon className="w-2.5 h-2.5" />
                    {data.incomingLinks || 0} in
                </span>
                <span className="flex items-center gap-0.5">
                    <ExternalLink className="w-2.5 h-2.5" />
                    {data.outgoingLinks || 0} out
                </span>
            </div>
        </div>
    );
}

export default memo(SupportingNode);
