'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

interface ExternalNodeData {
    title: string;
    url: string | null;
}

function ExternalNode({ data, selected }: NodeProps<ExternalNodeData>) {
    return (
        <div
            className={cn(
                'px-3 py-2 rounded-full border-2 border-green-500 bg-green-50',
                'min-w-[120px] max-w-[180px]',
                'shadow-sm transition-shadow',
                selected && 'ring-2 ring-green-500 ring-offset-2'
            )}
        >
            {/* Connection handles - 4 handles, one per side */}
            <Handle type="source" position={Position.Top} id="top" className="w-3 h-3 !bg-green-500 border-2 border-white" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="w-3 h-3 !bg-green-500 border-2 border-white" />
            <Handle type="source" position={Position.Left} id="left" className="w-3 h-3 !bg-green-500 border-2 border-white" />
            <Handle type="source" position={Position.Right} id="right" className="w-3 h-3 !bg-green-500 border-2 border-white" />

            <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span className="text-xs font-medium text-green-800 truncate">
                    {data.title}
                </span>
            </div>
        </div>
    );
}

export default memo(ExternalNode);
