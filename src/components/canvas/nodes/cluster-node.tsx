'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileText, Link as LinkIcon, ExternalLink, Edit3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/helpers';
import { STATUS_LABELS } from '@/lib/utils/constants';
import type { NodeStatus } from '@/lib/types';

interface ClusterNodeData {
    nodeId: string;
    projectId: string;
    title: string;
    target_keyword: string | null;
    status: NodeStatus;
    incomingLinks?: number;
    outgoingLinks?: number;
}

const statusStyles: Record<NodeStatus, string> = {
    planned: 'border-dashed border-gray-400 bg-gray-50',
    writing: 'border-solid border-amber-400 bg-amber-50',
    published: 'border-solid border-blue-500 bg-blue-50',
    needs_update: 'border-solid border-orange-400 bg-orange-50',
};

const statusDotColors: Record<NodeStatus, string> = {
    planned: 'bg-gray-400',
    writing: 'bg-amber-400',
    published: 'bg-blue-500',
    needs_update: 'bg-orange-400',
};

function ClusterNode({ data, selected }: NodeProps<ClusterNodeData>) {
    const router = useRouter();

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/project/${data.projectId}/article/${data.nodeId}`);
    };

    return (
        <div
            className={cn(
                'px-4 py-3 rounded-lg border-2 min-w-[180px] max-w-[240px]',
                'shadow-sm transition-shadow',
                statusStyles[data.status],
                selected && 'ring-2 ring-blue-500 ring-offset-2'
            )}
        >
            {/* Connection handles - 4 handles, one per side */}
            <Handle type="source" position={Position.Top} id="top" className="w-3 h-3 !bg-blue-500 border-2 border-white" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="w-3 h-3 !bg-blue-500 border-2 border-white" />
            <Handle type="source" position={Position.Left} id="left" className="w-3 h-3 !bg-blue-500 border-2 border-white" />
            <Handle type="source" position={Position.Right} id="right" className="w-3 h-3 !bg-blue-500 border-2 border-white" />

            {/* Status badge */}
            <div className="flex items-center gap-2 mb-2">
                <span className={cn('w-2 h-2 rounded-full', statusDotColors[data.status])} />
                <span className="text-xs font-medium text-blue-700">
                    {STATUS_LABELS[data.status]}
                </span>
            </div>

            {/* Title */}
            <h3 className="font-medium text-gray-900 text-sm leading-tight mb-2">
                {data.title}
            </h3>

            {/* Keyword */}
            {data.target_keyword && (
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                    <FileText className="w-3 h-3" />
                    <span className="truncate">{data.target_keyword}</span>
                </div>
            )}

            {/* Link counts and Edit button */}
            <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" />
                        {data.incomingLinks || 0} in
                    </span>
                    <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {data.outgoingLinks || 0} out
                    </span>
                </div>
                <button
                    onClick={handleEditClick}
                    className="p-1 rounded hover:bg-blue-200 text-blue-600 transition-colors"
                    title="Edit Article"
                >
                    <Edit3 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

export default memo(ClusterNode);
