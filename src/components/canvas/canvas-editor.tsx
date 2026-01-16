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
    SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { toPng } from 'html-to-image';

import { useCanvasStore, dbNodeToFlowNode, dbEdgeToFlowEdge } from '@/lib/store/canvas-store';
import { useCanvasHistoryStore } from '@/lib/store/canvas-history-store';
import { createClient } from '@/lib/supabase/client';
import { EDGE_STYLES } from '@/lib/utils/constants';
import { normalizeSlug } from '@/lib/utils/helpers';
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
import type { UserRole } from '@/lib/utils/roles';
import { canEditContent } from '@/lib/utils/roles';

interface CanvasEditorProps {
    projectId: string;
    userRole?: UserRole;
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

function CanvasEditorInner({ projectId, userRole = 'owner' }: CanvasEditorProps) {
    const canEdit = canEditContent(userRole);
    const { fitView, zoomIn, zoomOut, getViewport } = useReactFlow();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isDraggingRef = useRef(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Refs to track current state for history (avoids stale closures)
    const nodesRef = useRef(useCanvasStore.getState().nodes);
    const edgesRef = useRef(useCanvasStore.getState().edges);

    // Edge modal state
    const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
    const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [editingEdge, setEditingEdge] = useState<{ id: string; edgeType: string; keyword: string; styleOptions: any } | null>(null);
    const [projectDomain, setProjectDomain] = useState<string>('');
    const [limitError, setLimitError] = useState<string | null>(null);

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

    // History store for undo/redo
    const {
        past,
        future,
        setCurrentSnapshot,
        pushState,
        undo,
        redo,
        clear: clearHistory,
    } = useCanvasHistoryStore();

    const canUndo = past.length > 0;
    const canRedo = future.length > 0;

    // Keep refs in sync with current state (for use in callbacks without stale closures)
    useEffect(() => {
        nodesRef.current = nodes;
        edgesRef.current = edges;
    }, [nodes, edges]);

    // Clear history when project changes
    useEffect(() => {
        clearHistory();
    }, [projectId, clearHistory]);

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
            // Normalize slug before saving
            const saveData = { ...data };
            if (saveData.slug) {
                saveData.slug = normalizeSlug(saveData.slug);
            }

            const supabase = createClient();
            await supabase
                .from('nodes')
                .update(saveData)
                .eq('id', nodeId);

            // Update local node state with normalized slug so UI shows correct value
            if (data.slug && saveData.slug !== data.slug) {
                updateNode(nodeId, { slug: saveData.slug });
            }
        } catch (error) {
            console.error('Failed to save node:', error);
        } finally {
            setIsSaving(false);
        }
    }, [setIsSaving, updateNode]);

    // Handle node changes with debounced save
    const handleNodesChange = useCallback((changes: any) => {
        // Check for drag start (capture snapshot before dragging)
        const dragStartChange = changes.find((c: any) => c.type === 'position' && c.dragging === true);
        if (dragStartChange && !isDraggingRef.current) {
            isDraggingRef.current = true;
            // Use refs to avoid stale closure issues
            setCurrentSnapshot(nodesRef.current, edgesRef.current);
        }

        // Check for drag end (push to history after dragging)
        const dragEndChange = changes.find((c: any) => c.type === 'position' && c.dragging === false);
        if (dragEndChange && isDraggingRef.current) {
            isDraggingRef.current = false;
            // Push history after the state update
            setTimeout(() => pushState('Moved Node'), 0);
        }

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
    }, [onNodesChange, setCurrentSnapshot, pushState]);

    // Handle adding a new node
    const handleAddNode = useCallback(async (type: NodeType) => {
        // Check node limit before creating
        try {
            const limitCheck = await fetch('/api/limits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'node', projectId })
            }).then(r => r.json());

            if (!limitCheck.allowed) {
                setLimitError(limitCheck.message || `You've reached your node limit (${limitCheck.limit}). Upgrade your plan to add more nodes.`);
                setTimeout(() => setLimitError(null), 5000); // Auto-hide after 5s
                return;
            }
        } catch (err) {
            console.error('Failed to check node limit:', err);
        }

        // Capture current state before adding node
        setCurrentSnapshot(nodesRef.current, edgesRef.current);

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

        // Push state to history
        pushState(`Added ${type.charAt(0).toUpperCase() + type.slice(1)} Node`);

        setSelectedNodeId(id);
    }, [projectId, getViewport, addNode, setSelectedNodeId, setCurrentSnapshot, pushState]);

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

        // Capture current state before deleting
        setCurrentSnapshot(nodesRef.current, edgesRef.current);

        const supabase = createClient();
        await supabase.from('nodes').delete().eq('id', selectedNodeId);

        deleteNode(selectedNodeId);

        // Push state to history
        pushState('Deleted Node');
    }, [selectedNodeId, deleteNode, setCurrentSnapshot, pushState]);

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

        // Capture current state before deleting
        setCurrentSnapshot(nodesRef.current, edgesRef.current);

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

        // Push state to history
        pushState('Deleted Link');
    }, [selectedEdgeId, edges, nodes, projectId, deleteEdge, pushState, setCurrentSnapshot]);

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

    // Handle undo - restore previous state
    const handleUndo = useCallback(() => {
        const snapshot = undo();
        if (snapshot) {
            setNodes(snapshot.nodes);
            setEdges(snapshot.edges);
        }
    }, [undo, setNodes, setEdges]);

    // Handle redo - restore next state
    const handleRedo = useCallback(() => {
        const snapshot = redo();
        if (snapshot) {
            setNodes(snapshot.nodes);
            setEdges(snapshot.edges);
        }
    }, [redo, setNodes, setEdges]);

    // Handle export to PNG
    const handleExportPNG = useCallback(async () => {
        if (!canvasRef.current) return;

        try {
            // Find the ReactFlow viewport element
            const viewport = canvasRef.current.querySelector('.react-flow__viewport') as HTMLElement;
            if (!viewport) {
                console.error('Could not find ReactFlow viewport');
                return;
            }

            // Get the ReactFlow container for proper dimensions
            const reactFlowWrapper = canvasRef.current.querySelector('.react-flow') as HTMLElement;
            if (!reactFlowWrapper) return;

            const dataUrl = await toPng(reactFlowWrapper, {
                backgroundColor: '#f9fafb', // Light gray background
                quality: 1,
                pixelRatio: 2, // Higher quality
            });

            // Create download link
            const link = document.createElement('a');
            link.download = `canvas-${projectId}-${new Date().toISOString().split('T')[0]}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Failed to export PNG:', error);
        }
    }, [projectId]);

    // Handle export to CSV
    const handleExportCSV = useCallback(() => {
        // Create CSV content for nodes
        const nodeHeaders = ['ID', 'Type', 'Title', 'Status', 'Target Keyword', 'Slug', 'Position X', 'Position Y'];
        const nodeRows = nodes.map(node => [
            node.id,
            node.type || '',
            `"${(node.data?.title || '').replace(/"/g, '""')}"`,
            node.data?.status || '',
            `"${(node.data?.target_keyword || '').replace(/"/g, '""')}"`,
            node.data?.slug || '',
            Math.round(node.position?.x || 0),
            Math.round(node.position?.y || 0),
        ].join(','));

        // Create CSV content for edges
        const edgeHeaders = ['ID', 'Source Node', 'Target Node', 'Edge Type', 'Label'];
        const edgeRows = edges.map(edge => [
            edge.id,
            edge.source,
            edge.target,
            edge.data?.edge_type || '',
            `"${(String(edge.label || '')).replace(/"/g, '""')}"`,
        ].join(','));

        // Combine into a single CSV with sections
        const csvContent = [
            '--- NODES ---',
            nodeHeaders.join(','),
            ...nodeRows,
            '',
            '--- EDGES ---',
            edgeHeaders.join(','),
            ...edgeRows,
        ].join('\n');

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `canvas-${projectId}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    }, [nodes, edges, projectId]);

    // Keyboard handler for delete (nodes and edges) and undo/redo
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Undo: Ctrl/Cmd + Z (without Shift)
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
                return;
            }

            // Redo: Ctrl/Cmd + Shift + Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                handleRedo();
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();

                // Check for selected nodes (multi-select)
                const selectedNodes = nodes.filter(n => n.selected);

                if (selectedEdgeId) {
                    // Prioritize edge deletion if an edge is selected
                    handleDeleteSelectedEdge();
                } else if (selectedNodes.length > 0) {
                    // Delete all selected nodes
                    const supabase = createClient();
                    for (const node of selectedNodes) {
                        await supabase.from('nodes').delete().eq('id', node.id);
                        deleteNode(node.id);
                    }
                    console.log(`[Canvas] Deleted ${selectedNodes.length} node(s)`);
                } else if (selectedNodeId) {
                    // Fallback to single node deletion via panel
                    handleNodeDelete();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedEdgeId, selectedNodeId, nodes, handleDeleteSelectedEdge, handleNodeDelete, deleteNode, handleUndo, handleRedo]);

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

        // Capture current state before adding edge
        setCurrentSnapshot(nodesRef.current, edgesRef.current);

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

        // Push state to history
        pushState('Added Link');

        setPendingConnection(null);
    }, [pendingConnection, editingEdge, projectId, edges, setEdges, nodes, setNodes, setCurrentSnapshot, pushState]);

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
        <div className="h-full relative" ref={canvasRef}>
            {/* Limit error banner */}
            {limitError && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg shadow-lg flex items-center gap-2 max-w-md">
                    <span className="text-amber-800 text-sm">{limitError}</span>
                    <button
                        onClick={() => setLimitError(null)}
                        className="text-amber-600 hover:text-amber-800 font-bold"
                    >
                        ×
                    </button>
                </div>
            )}

            <CanvasToolbar
                onAddNode={handleAddNode}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onFitView={() => fitView({ padding: 0.2 })}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onExportPNG={handleExportPNG}
                onExportCSV={handleExportCSV}
                canUndo={canUndo}
                canRedo={canRedo}
                zoom={zoom}
                canEdit={canEdit}
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
                elevateEdgesOnSelect={true}
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
                // Multi-select features
                nodesDraggable={canEdit}
                selectionOnDrag={true}
                selectionMode={SelectionMode.Partial}
                panOnDrag={[1, 2]} // Pan with middle and right mouse button
                panOnScroll={true} // Also allow panning with scroll
                multiSelectionKeyCode="Shift"
                deleteKeyCode={null} // Disable default delete - we handle it ourselves
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
