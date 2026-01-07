import { create } from 'zustand';
import { Node, Edge, Viewport, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection, addEdge, MarkerType } from 'reactflow';
import type { ContentNode, ContentEdge, NodeType, NodeStatus } from '@/lib/types';

interface CanvasState {
    // Data
    nodes: Node[];
    edges: Edge[];
    viewport: Viewport;

    // UI state
    selectedNodeId: string | null;
    isLoading: boolean;
    isSaving: boolean;

    // Actions
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    addNode: (node: Node) => void;
    updateNode: (id: string, data: Partial<Node['data']>) => void;
    updateNodePosition: (id: string, position: { x: number; y: number }) => void;
    deleteNode: (id: string) => void;
    deleteEdge: (id: string) => void;
    setSelectedNodeId: (id: string | null) => void;
    setViewport: (viewport: Viewport) => void;
    setIsLoading: (loading: boolean) => void;
    setIsSaving: (saving: boolean) => void;

    // Helpers
    getSelectedNode: () => Node | undefined;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedNodeId: null,
    isLoading: false,
    isSaving: false,

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),

    onNodesChange: (changes) => set((state) => ({
        nodes: applyNodeChanges(changes, state.nodes),
    })),

    onEdgesChange: (changes) => set((state) => ({
        edges: applyEdgeChanges(changes, state.edges),
    })),

    onConnect: (connection) => set((state) => ({
        edges: addEdge({
            ...connection,
            type: 'internal_link',
            animated: false,
            style: { stroke: '#3B82F6', strokeWidth: 2 },
        }, state.edges),
    })),

    addNode: (node) => set((state) => ({
        nodes: [...state.nodes, node]
    })),

    updateNode: (id, data) => set((state) => ({
        nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...data } } : n
        ),
    })),

    updateNodePosition: (id, position) => set((state) => ({
        nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, position } : n
        ),
    })),

    deleteNode: (id) => set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== id),
        edges: state.edges.filter(
            (e) => e.source !== id && e.target !== id
        ),
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    })),

    deleteEdge: (id) => set((state) => ({
        edges: state.edges.filter((e) => e.id !== id),
    })),

    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    setViewport: (viewport) => set({ viewport }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setIsSaving: (isSaving) => set({ isSaving }),

    getSelectedNode: () => {
        const { nodes, selectedNodeId } = get();
        return nodes.find((n) => n.id === selectedNodeId);
    },
}));

// Helper function to convert DB node to React Flow node
export function dbNodeToFlowNode(node: ContentNode, linkCounts?: { incoming: number; outgoing: number }): Node {
    return {
        id: node.id,
        type: node.node_type,
        position: { x: node.position_x, y: node.position_y },
        data: {
            title: node.title,
            target_keyword: node.target_keyword,
            status: node.status,
            slug: node.slug,
            url: node.url,
            notes: node.notes,
            word_count_target: node.word_count_target,
            assigned_to: node.assigned_to,
            publish_date: node.publish_date,
            incomingLinks: linkCounts?.incoming || 0,
            outgoingLinks: linkCounts?.outgoing || 0,
        },
    };
}

// Helper function to convert DB edge to React Flow edge
export function dbEdgeToFlowEdge(edge: ContentEdge): Edge {
    const edgeColors: Record<string, string> = {
        hierarchy: '#3B82F6',
        sibling: '#93C5FD',
        cross_cluster: '#8B5CF6',
        outbound: '#9CA3AF',
        backlink: '#10B981',
    };

    const color = edgeColors[edge.edge_type] || edgeColors.hierarchy;
    const strokeWidth = edge.stroke_width || 2;
    const arrowSize = edge.arrow_size || 16;

    // Convert line_style to strokeDasharray
    const strokeDasharray =
        edge.line_style === 'dashed' ? '8,4' :
            edge.line_style === 'dotted' ? '2,4' : undefined;

    return {
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        sourceHandle: edge.source_handle_id || undefined,
        targetHandle: edge.target_handle_id || undefined,
        type: 'custom',
        animated: false,
        label: edge.label || undefined,
        labelStyle: { fill: '#374151', fontWeight: 500, fontSize: 11 },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.9, stroke: '#e5e7eb', strokeWidth: 1 },
        labelBgPadding: [4, 6] as [number, number],
        labelShowBg: true,
        style: {
            stroke: color,
            strokeWidth: strokeWidth,
            strokeDasharray: strokeDasharray,
        },
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: color,
            width: arrowSize,
            height: arrowSize,
        },
        data: {
            edge_type: edge.edge_type,
            keyword: edge.label,
            project_id: edge.project_id,
        },
    };
}
