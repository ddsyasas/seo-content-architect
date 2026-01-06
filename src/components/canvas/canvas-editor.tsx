'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

import { useCanvasStore, dbNodeToFlowNode, dbEdgeToFlowEdge } from '@/lib/store/canvas-store';
import { createClient } from '@/lib/supabase/client';
import { CanvasToolbar } from './canvas-toolbar';
import { NodeDetailPanel } from './node-detail-panel';
import PillarNode from './nodes/pillar-node';
import ClusterNode from './nodes/cluster-node';
import PlannedNode from './nodes/planned-node';
import ExternalNode from './nodes/external-node';
import type { NodeType, NodeStatus, ContentNode, ContentEdge } from '@/lib/types';

interface CanvasEditorProps {
    projectId: string;
}

const nodeTypes = {
    pillar: PillarNode,
    cluster: ClusterNode,
    planned: PlannedNode,
    external: ExternalNode,
};

function CanvasEditorInner({ projectId }: CanvasEditorProps) {
    const { fitView, zoomIn, zoomOut, getViewport } = useReactFlow();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const {
        nodes,
        edges,
        selectedNodeId,
        isLoading,
        setNodes,
        setEdges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        updateNode,
        deleteNode,
        setSelectedNodeId,
        setIsLoading,
        setIsSaving,
        getSelectedNode,
    } = useCanvasStore();

    // Load project data
    useEffect(() => {
        loadProjectData();
    }, [projectId]);

    const loadProjectData = async () => {
        setIsLoading(true);
        try {
            const supabase = createClient();

            // Fetch nodes
            const { data: nodesData, error: nodesError } = await supabase
                .from('nodes')
                .select('*')
                .eq('project_id', projectId);

            if (nodesError) throw nodesError;

            // Fetch edges
            const { data: edgesData, error: edgesError } = await supabase
                .from('edges')
                .select('*')
                .eq('project_id', projectId);

            if (edgesError) throw edgesError;

            // Calculate link counts
            const linkCounts: Record<string, { incoming: number; outgoing: number }> = {};
            (edgesData || []).forEach((edge: ContentEdge) => {
                if (!linkCounts[edge.source_node_id]) {
                    linkCounts[edge.source_node_id] = { incoming: 0, outgoing: 0 };
                }
                if (!linkCounts[edge.target_node_id]) {
                    linkCounts[edge.target_node_id] = { incoming: 0, outgoing: 0 };
                }
                linkCounts[edge.source_node_id].outgoing++;
                linkCounts[edge.target_node_id].incoming++;
            });

            // Convert to React Flow format
            const flowNodes = (nodesData || []).map((node: ContentNode) =>
                dbNodeToFlowNode(node, linkCounts[node.id])
            );
            const flowEdges = (edgesData || []).map(dbEdgeToFlowEdge);

            setNodes(flowNodes);
            setEdges(flowEdges);

            // Fit view after loading
            setTimeout(() => fitView({ padding: 0.2 }), 100);
        } catch (error) {
            console.error('Failed to load project data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Save node to database (debounced)
    const saveNodeToDb = useCallback(async (nodeId: string, data: Partial<ContentNode>) => {
        setIsSaving(true);
        try {
            const supabase = createClient();
            await supabase
                .from('nodes')
                .update(data)
                .eq('id', nodeId);
        } catch (error) {
            console.error('Failed to save node:', error);
        } finally {
            setIsSaving(false);
        }
    }, [setIsSaving]);

    // Handle node changes with debounced save
    const handleNodesChange = useCallback((changes: any) => {
        onNodesChange(changes);

        // Save position changes
        const positionChanges = changes.filter((c: any) => c.type === 'position' && c.position);
        if (positionChanges.length > 0) {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(async () => {
                const supabase = createClient();
                for (const change of positionChanges) {
                    await supabase
                        .from('nodes')
                        .update({
                            position_x: change.position.x,
                            position_y: change.position.y,
                        })
                        .eq('id', change.id);
                }
            }, 500);
        }
    }, [onNodesChange]);

    // Handle adding a new node
    const handleAddNode = useCallback(async (type: NodeType) => {
        const viewport = getViewport();
        const id = uuidv4();
        const position = {
            x: (400 - viewport.x) / viewport.zoom,
            y: (300 - viewport.y) / viewport.zoom,
        };

        // Create in database
        const supabase = createClient();
        const { error } = await supabase
            .from('nodes')
            .insert({
                id,
                project_id: projectId,
                node_type: type,
                title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                status: 'planned' as NodeStatus,
                position_x: position.x,
                position_y: position.y,
            });

        if (error) {
            console.error('Failed to create node:', error);
            return;
        }

        // Add to canvas
        addNode({
            id,
            type,
            position,
            data: {
                title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                target_keyword: null,
                status: 'planned' as NodeStatus,
                incomingLinks: 0,
                outgoingLinks: 0,
            },
        });

        setSelectedNodeId(id);
    }, [projectId, getViewport, addNode, setSelectedNodeId]);

    // Handle node click
    const handleNodeClick = useCallback((_: any, node: any) => {
        setSelectedNodeId(node.id);
    }, [setSelectedNodeId]);

    // Handle pane click (deselect)
    const handlePaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, [setSelectedNodeId]);

    // Handle node detail change
    const handleNodeDetailChange = useCallback((data: any) => {
        if (!selectedNodeId) return;
        updateNode(selectedNodeId, data);

        // Debounced save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveNodeToDb(selectedNodeId, data);
        }, 500);
    }, [selectedNodeId, updateNode, saveNodeToDb]);

    // Handle node delete
    const handleNodeDelete = useCallback(async () => {
        if (!selectedNodeId) return;

        const supabase = createClient();
        await supabase.from('nodes').delete().eq('id', selectedNodeId);

        deleteNode(selectedNodeId);
    }, [selectedNodeId, deleteNode]);

    // Handle edge creation
    const handleConnect = useCallback(async (connection: any) => {
        const id = uuidv4();

        const supabase = createClient();
        const { error } = await supabase
            .from('edges')
            .insert({
                id,
                project_id: projectId,
                source_node_id: connection.source,
                target_node_id: connection.target,
                edge_type: 'internal_link',
            });

        if (error) {
            console.error('Failed to create edge:', error);
            return;
        }

        onConnect({ ...connection, id });
    }, [projectId, onConnect]);

    const selectedNode = getSelectedNode();
    const zoom = getViewport().zoom;

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading canvas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full relative">
            <CanvasToolbar
                onAddNode={handleAddNode}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onFitView={() => fitView({ padding: 0.2 })}
                zoom={zoom}
            />

            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={handleNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={handleConnect}
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
                defaultEdgeOptions={{
                    style: { stroke: '#3B82F6', strokeWidth: 2 },
                    type: 'default',
                }}
            >
                <Background gap={20} size={1} />
                <MiniMap
                    nodeColor={(n) => {
                        switch (n.type) {
                            case 'pillar': return '#6366F1';
                            case 'cluster': return '#3B82F6';
                            case 'planned': return '#9CA3AF';
                            case 'external': return '#10B981';
                            default: return '#9CA3AF';
                        }
                    }}
                    className="!bg-gray-100"
                />
            </ReactFlow>

            <NodeDetailPanel
                node={selectedNode}
                onClose={() => setSelectedNodeId(null)}
                onChange={handleNodeDetailChange}
                onDelete={handleNodeDelete}
            />
        </div>
    );
}

export function CanvasEditor(props: CanvasEditorProps) {
    return (
        <ReactFlowProvider>
            <CanvasEditorInner {...props} />
        </ReactFlowProvider>
    );
}
