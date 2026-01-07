'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    useReactFlow,
    Connection,
    MarkerType,
    ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

import { useCanvasStore, dbNodeToFlowNode, dbEdgeToFlowEdge } from '@/lib/store/canvas-store';
import { createClient } from '@/lib/supabase/client';
import { EDGE_STYLES } from '@/lib/utils/constants';
import { CanvasToolbar } from './canvas-toolbar';
import { NodeDetailPanel } from './node-detail-panel';
import { EdgeModal } from './edge-modal';
import CustomLabelEdge from './edges/custom-label-edge';
import PillarNode from './nodes/pillar-node';
import ClusterNode from './nodes/cluster-node';
import SupportingNode from './nodes/supporting-node';
import PlannedNode from './nodes/planned-node';
import ExternalNode from './nodes/external-node';
import type { NodeType, NodeStatus, ContentNode, ContentEdge, EdgeType } from '@/lib/types';

interface CanvasEditorProps {
    projectId: string;
}

const nodeTypes = {
    pillar: PillarNode,
    cluster: ClusterNode,
    supporting: SupportingNode,
    planned: PlannedNode,
    external: ExternalNode,
};

const edgeTypes = {
    custom: CustomLabelEdge,
};

function CanvasEditorInner({ projectId }: CanvasEditorProps) {
    const { fitView, zoomIn, zoomOut, getViewport } = useReactFlow();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Edge modal state
    const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
    const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [editingEdge, setEditingEdge] = useState<{ id: string; edgeType: string; keyword: string; styleOptions: any } | null>(null);
    const [projectDomain, setProjectDomain] = useState<string>('');

    const {
        nodes,
        edges,
        selectedNodeId,
        isLoading,
        setNodes,
        setEdges,
        onNodesChange,
        onEdgesChange,
        addNode,
        updateNode,
        deleteNode,
        setSelectedNodeId,
        setIsLoading,
        setIsSaving,
        getSelectedNode,
        deleteEdge,
    } = useCanvasStore();

    // Load project data
    useEffect(() => {
        loadProjectData();
    }, [projectId]);

    const loadProjectData = async () => {
        setIsLoading(true);
        try {
            const supabase = createClient();

            // Fetch project domain
            const { data: project } = await supabase
                .from('projects')
                .select('domain')
                .eq('id', projectId)
                .single();
            if (project?.domain) setProjectDomain(project.domain);

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
                dbNodeToFlowNode(node, linkCounts[node.id], projectId)
            );
            const flowEdges = (edgesData || []).map(dbEdgeToFlowEdge);

            // Determine externalType for external nodes based on connected edges
            // Backlink: external is SOURCE, Outbound: external is TARGET
            const externalTypes: Record<string, 'backlink' | 'outbound'> = {};
            (edgesData || []).forEach((edge: ContentEdge) => {
                if (edge.edge_type === 'backlink') {
                    externalTypes[edge.source_node_id] = 'backlink';
                } else if (edge.edge_type === 'outbound') {
                    externalTypes[edge.target_node_id] = 'outbound';
                }
            });

            // Update external nodes with their type
            const updatedFlowNodes = flowNodes.map(node => {
                if (node.type === 'external' && externalTypes[node.id]) {
                    return {
                        ...node,
                        data: { ...node.data, externalType: externalTypes[node.id] }
                    };
                }
                return node;
            });

            setNodes(updatedFlowNodes);
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
        setSelectedEdgeId(null);
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

    // Handle edge click (select edge)
    const handleEdgeClick = useCallback((_: any, edge: any) => {
        setSelectedEdgeId(edge.id);
        setSelectedNodeId(null);
    }, [setSelectedNodeId]);

    // Handle edge double-click (edit edge)
    const handleEdgeDoubleClick = useCallback((_: any, edge: any) => {
        const styleOptions = edge.data?.styleOptions || {
            lineWidth: edge.style?.strokeWidth || 2,
            arrowSize: edge.markerEnd?.width || 16,
            lineStyle: edge.style?.strokeDasharray === '8,4' ? 'dashed' :
                edge.style?.strokeDasharray === '2,4' ? 'dotted' : 'solid'
        };

        setEditingEdge({
            id: edge.id,
            edgeType: edge.data?.edge_type || 'hierarchy',
            keyword: edge.label || '',
            styleOptions
        });
        setIsEdgeModalOpen(true);
    }, []);

    // Handle edge delete - also removes link from article if applicable
    const handleDeleteSelectedEdge = useCallback(async () => {
        if (!selectedEdgeId) return;

        const supabase = createClient();

        // Get the edge details before deleting
        const edgeToDelete = edges.find(e => e.id === selectedEdgeId);
        console.log('[Canvas-Sync] Deleting edge:', edgeToDelete);

        if (edgeToDelete) {
            // Get source node and target node to find the article and slug
            const sourceNodeId = edgeToDelete.source;
            const targetNodeId = edgeToDelete.target;

            // Get target node properties
            const targetNode = nodes.find(n => n.id === targetNodeId);
            const targetSlug = targetNode?.data?.slug;
            const targetTitle = targetNode?.data?.title;
            const isExternal = targetNode?.type === 'external';

            console.log('[Canvas-Sync] Target node:', targetTitle, 'slug:', targetSlug, 'type:', targetNode?.type);

            if (targetSlug || (isExternal && targetTitle)) {
                // Get project domain
                const { data: projectData } = await supabase
                    .from('projects')
                    .select('domain')
                    .eq('id', projectId)
                    .single();
                console.log('[Canvas-Sync] Project domain:', projectData?.domain);

                if (projectData?.domain) {
                    // Get article content
                    const { data: articleData } = await supabase
                        .from('articles')
                        .select('id, content')
                        .eq('node_id', sourceNodeId)
                        .single();
                    console.log('[Canvas-Sync] Article found:', !!articleData?.content);

                    if (articleData?.content) {
                        // Import dynamically to avoid circular deps
                        const { removeLinkBySlug, removeExternalLink } = await import('@/lib/utils/link-parser');

                        let updatedContent = articleData.content;
                        if (isExternal && targetTitle) {
                            updatedContent = removeExternalLink(articleData.content, targetTitle);
                        } else if (targetSlug) {
                            updatedContent = removeLinkBySlug(articleData.content, projectData.domain, targetSlug);
                        }

                        if (updatedContent !== articleData.content) {
                            // Update article with link removed
                            await supabase
                                .from('articles')
                                .update({ content: updatedContent })
                                .eq('id', articleData.id);
                            console.log(`[Canvas-Sync] ✅ Removed link to ${isExternal ? targetTitle : targetSlug} from article`);
                        } else {
                            console.log('[Canvas-Sync] No matching link found in article');
                        }
                    }
                }
            }
        }

        // Delete the edge
        await supabase.from('edges').delete().eq('id', selectedEdgeId);
        deleteEdge(selectedEdgeId);
        setSelectedEdgeId(null);
    }, [selectedEdgeId, edges, nodes, projectId, deleteEdge]);

    // Handle edge update (reconnection by dragging)
    const handleEdgeUpdate = useCallback(async (oldEdge: any, newConnection: Connection) => {
        if (!newConnection.source || !newConnection.target) return;

        const supabase = createClient();
        await supabase.from('edges').update({
            source_node_id: newConnection.source,
            target_node_id: newConnection.target,
            source_handle_id: newConnection.sourceHandle,
            target_handle_id: newConnection.targetHandle,
        }).eq('id', oldEdge.id);

        // Update edge in state
        setEdges(edges.map(e =>
            e.id === oldEdge.id
                ? { ...e, source: newConnection.source!, target: newConnection.target!, sourceHandle: newConnection.sourceHandle, targetHandle: newConnection.targetHandle }
                : e
        ));
    }, [edges, setEdges]);

    // Keyboard handler for delete
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
                e.preventDefault();
                handleDeleteSelectedEdge();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedEdgeId, handleDeleteSelectedEdge]);

    // Handle connection start - show edge modal
    const handleConnect = useCallback((connection: Connection) => {
        setPendingConnection(connection);
        setIsEdgeModalOpen(true);
    }, []);

    // Handle edge modal submit (for both create and edit)
    const handleEdgeModalSubmit = useCallback(async ({
        edgeType,
        keyword,
        styleOptions
    }: {
        edgeType: EdgeType;
        keyword: string;
        styleOptions: { lineWidth: number; arrowSize: number; lineStyle: 'solid' | 'dashed' | 'dotted' }
    }) => {
        const baseStyle = EDGE_STYLES[edgeType];
        const strokeDasharray =
            styleOptions.lineStyle === 'dashed' ? '8,4' :
                styleOptions.lineStyle === 'dotted' ? '2,4' : undefined;

        const supabase = createClient();

        // EDIT MODE - Update existing edge
        if (editingEdge) {
            const { error } = await supabase
                .from('edges')
                .update({
                    edge_type: edgeType,
                    label: keyword,
                    stroke_width: styleOptions.lineWidth,
                    arrow_size: styleOptions.arrowSize,
                    line_style: styleOptions.lineStyle,
                })
                .eq('id', editingEdge.id);

            if (error) {
                console.error('Failed to update edge:', error);
                return;
            }

            // Update edge in canvas state
            setEdges(edges.map(e => e.id === editingEdge.id ? {
                ...e,
                label: keyword,
                style: {
                    stroke: baseStyle.stroke,
                    strokeWidth: styleOptions.lineWidth,
                    strokeDasharray: strokeDasharray,
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: baseStyle.stroke,
                    width: styleOptions.arrowSize,
                    height: styleOptions.arrowSize,
                },
                data: { ...e.data, edge_type: edgeType, keyword, styleOptions },
            } : e));

            setEditingEdge(null);
            return;
        }

        // CREATE MODE - Create new edge
        if (!pendingConnection) return;

        const id = uuidv4();

        const { error } = await supabase
            .from('edges')
            .insert({
                id,
                project_id: projectId,
                source_node_id: pendingConnection.source,
                target_node_id: pendingConnection.target,
                source_handle_id: pendingConnection.sourceHandle,
                target_handle_id: pendingConnection.targetHandle,
                edge_type: edgeType,
                label: keyword,
                stroke_width: styleOptions.lineWidth,
                arrow_size: styleOptions.arrowSize,
                line_style: styleOptions.lineStyle,
            });

        if (error) {
            console.error('Failed to create edge:', error);
            return;
        }

        // Add edge to canvas with custom styling
        setEdges([...edges, {
            id,
            source: pendingConnection.source!,
            target: pendingConnection.target!,
            sourceHandle: pendingConnection.sourceHandle,
            targetHandle: pendingConnection.targetHandle,
            type: 'custom',
            label: keyword,
            labelStyle: { fill: '#374151', fontWeight: 500, fontSize: 11 },
            labelBgStyle: { fill: '#fff', fillOpacity: 0.9, stroke: '#e5e7eb', strokeWidth: 1 },
            labelBgPadding: [4, 6] as [number, number],
            labelShowBg: true,
            style: {
                stroke: baseStyle.stroke,
                strokeWidth: styleOptions.lineWidth,
                strokeDasharray: strokeDasharray,
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: baseStyle.stroke,
                width: styleOptions.arrowSize,
                height: styleOptions.arrowSize,
            },
            data: { edge_type: edgeType, keyword, project_id: projectId, styleOptions },
        }]);

        // Update external node's type when backlink or outbound edge is created
        // Backlink: external site links TO us, so external is SOURCE
        // Outbound: we link TO external site, so external is TARGET
        if (edgeType === 'backlink') {
            const sourceNode = nodes.find(n => n.id === pendingConnection.source);
            if (sourceNode && sourceNode.type === 'external') {
                setNodes(nodes.map(n => n.id === sourceNode.id ? {
                    ...n,
                    data: { ...n.data, externalType: 'backlink' }
                } : n));
            }
        } else if (edgeType === 'outbound') {
            const targetNode = nodes.find(n => n.id === pendingConnection.target);
            if (targetNode && targetNode.type === 'external') {
                setNodes(nodes.map(n => n.id === targetNode.id ? {
                    ...n,
                    data: { ...n.data, externalType: 'outbound' }
                } : n));
            }
        }

        setPendingConnection(null);
    }, [pendingConnection, editingEdge, projectId, edges, setEdges, nodes, setNodes]);

    // Handle edge modal close
    const handleEdgeModalClose = useCallback(() => {
        setIsEdgeModalOpen(false);
        setPendingConnection(null);
        setEditingEdge(null);
    }, []);

    const selectedNode = getSelectedNode();
    const zoom = getViewport().zoom;

    // Apply selection styling to edges
    const styledEdges = edges.map(edge => ({
        ...edge,
        selected: edge.id === selectedEdgeId,
        style: {
            ...edge.style,
            stroke: edge.id === selectedEdgeId ? '#EF4444' : edge.style?.stroke,
            strokeWidth: edge.id === selectedEdgeId ? 4 : edge.style?.strokeWidth,
        },
    }));

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
                edges={styledEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={handleNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={handleConnect}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                onEdgeDoubleClick={handleEdgeDoubleClick}
                onEdgeUpdate={handleEdgeUpdate}
                onPaneClick={handlePaneClick}
                edgesUpdatable={true}
                edgesFocusable={true}
                elementsSelectable={true}
                edgeUpdaterRadius={20}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
                connectionMode={ConnectionMode.Loose}
                connectionLineStyle={{ stroke: '#3B82F6', strokeWidth: 2 }}
                defaultEdgeOptions={{
                    style: { stroke: '#3B82F6', strokeWidth: 2 },
                    type: 'default',
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#3B82F6' },
                }}
            >
                <Background gap={20} size={1} />
                <MiniMap
                    nodeColor={(n) => {
                        switch (n.type) {
                            case 'pillar': return '#6366F1';
                            case 'cluster': return '#3B82F6';
                            case 'supporting': return '#06B6D4';
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
                projectDomain={projectDomain}
                projectId={projectId}
            />

            {/* Edge creation/edit modal */}
            <EdgeModal
                isOpen={isEdgeModalOpen}
                onClose={handleEdgeModalClose}
                onSubmit={handleEdgeModalSubmit}
                isEdit={!!editingEdge}
                initialData={editingEdge ? {
                    edgeType: editingEdge.edgeType as EdgeType,
                    keyword: editingEdge.keyword,
                    styleOptions: editingEdge.styleOptions
                } : undefined}
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
