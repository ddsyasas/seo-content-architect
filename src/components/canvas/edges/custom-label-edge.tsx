'use client';

import { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

// Custom edge that positions label near the source (origin) node
function CustomLabelEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    label,
    style,
    markerEnd,
    selected,
}: EdgeProps) {
    // Get the bezier path
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Calculate direction vector and distance
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Position label at a fixed distance from source toward target
    const labelOffset = Math.min(70, distance * 0.3);
    const labelX = sourceX + (dx / distance) * labelOffset;
    const labelY = sourceY + (dy / distance) * labelOffset;

    // Apply selection styling to the edge line
    const edgeStyle = selected
        ? { ...style, stroke: '#EF4444', strokeWidth: 4 }
        : style;

    // Dynamic z-index: selected labels come to front above all other labels
    const labelZIndex = selected ? 9999 : 1000;

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                style={edgeStyle}
                markerEnd={markerEnd}
            />
            {label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                            pointerEvents: 'all',
                            zIndex: labelZIndex,
                        }}
                        className="nodrag nopan"
                    >
                        <div
                            className={selected
                                ? "bg-red-50 dark:bg-red-900/40 border-2 border-red-500 dark:border-red-400 text-red-600 dark:text-red-300 shadow-lg"
                                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 shadow-sm"
                            }
                            style={{
                                padding: selected ? '6px 10px' : '4px 8px',
                                borderRadius: selected ? '6px' : '4px',
                                fontSize: selected ? '12px' : '11px',
                                fontWeight: selected ? 600 : 500,
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s ease-out',
                                boxShadow: selected
                                    ? '0 4px 12px rgba(239, 68, 68, 0.3), 0 0 0 4px rgba(239, 68, 68, 0.1)'
                                    : undefined,
                            }}
                        >
                            {label}
                        </div>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}

export default memo(CustomLabelEdge);
