'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ExternalLink, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

interface ExternalNodeData {
    title: string;
    url: string | null;
    externalType?: 'backlink' | 'outbound' | null;
}

function ExternalNode({ data, selected }: NodeProps<ExternalNodeData>) {
    // Determine display based on external type
    const isBacklink = data.externalType === 'backlink';
    const isOutbound = data.externalType === 'outbound';

    // Set colors and label based on type
    const borderColor = isBacklink ? 'border-green-500' : isOutbound ? 'border-orange-500' : 'border-green-500';
    const bgColor = isBacklink ? 'bg-green-50' : isOutbound ? 'bg-orange-50' : 'bg-green-50';
    const ringColor = isBacklink ? 'ring-green-500' : isOutbound ? 'ring-orange-500' : 'ring-green-500';
    const textColor = isBacklink ? 'text-green-800' : isOutbound ? 'text-orange-800' : 'text-green-800';
    const iconColor = isBacklink ? 'text-green-600' : isOutbound ? 'text-orange-600' : 'text-green-600';
    const handleColor = isBacklink ? '!bg-green-500' : isOutbound ? '!bg-orange-500' : '!bg-green-500';

    // Display appropriate icon
    const Icon = isBacklink ? ArrowDownLeft : isOutbound ? ArrowUpRight : ExternalLink;

    // Get display label
    const displayTitle = isBacklink ? 'Backlink' : isOutbound ? 'Outbound Link' : data.title;

    return (
        <div
            className={cn(
                `px-3 py-2 rounded-full border-2 ${borderColor} ${bgColor}`,
                'min-w-[120px] max-w-[180px]',
                'shadow-sm transition-shadow',
                selected && `ring-2 ${ringColor} ring-offset-2`
            )}
        >
            {/* Connection handles - 4 handles, one per side */}
            <Handle type="source" position={Position.Top} id="top" className={`w-3 h-3 ${handleColor} border-2 border-white`} />
            <Handle type="source" position={Position.Bottom} id="bottom" className={`w-3 h-3 ${handleColor} border-2 border-white`} />
            <Handle type="source" position={Position.Left} id="left" className={`w-3 h-3 ${handleColor} border-2 border-white`} />
            <Handle type="source" position={Position.Right} id="right" className={`w-3 h-3 ${handleColor} border-2 border-white`} />

            <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${iconColor} flex-shrink-0`} />
                <span className={`text-xs font-medium ${textColor} truncate`}>
                    {displayTitle}
                </span>
            </div>
        </div>
    );
}

export default memo(ExternalNode);
