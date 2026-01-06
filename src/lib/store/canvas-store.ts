import { create } from 'zustand';
import { Node, Edge, Viewport, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection, addEdge } from 'reactflow';
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
    const edgeStyles: Record<string, { stroke: string; strokeWidth: number; strokeDasharray?: string }> = {
        hierarchy: { stroke: '#6366F1', strokeWidth: 3 },
        internal_link: { stroke: '#3B82F6', strokeWidth: 2 },
        planned_link: { stroke: '#9CA3AF', strokeWidth: 2, strokeDasharray: '5,5' },
        external_link: { stroke: '#10B981', strokeWidth: 2, strokeDasharray: '2,2' },
    };

    return {
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        type: 'default',
        animated: edge.edge_type === 'hierarchy',
        label: edge.label || undefined,
        style: edgeStyles[edge.edge_type] || edgeStyles.internal_link,
        data: {
            edge_type: edge.edge_type,
            project_id: edge.project_id,
        },
    };
}
