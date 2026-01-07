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

    // Simple approach: position label at a fixed distance from source
    // toward the target (about 50-60 pixels from source)
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize and move 60 pixels from source toward target
    const labelOffset = Math.min(60, distance * 0.25);
    const labelX = sourceX + (dx / distance) * labelOffset;
    const labelY = sourceY + (dy / distance) * labelOffset;

    // Apply selection styling
    const edgeStyle = selected
        ? { ...style, stroke: '#EF4444', strokeWidth: 4 }
        : style;

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
                            zIndex: 1000,
                        }}
                        className="nodrag nopan"
                    >
                        <div
                            style={{
                                background: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 500,
                                color: '#374151',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                whiteSpace: 'nowrap',
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
