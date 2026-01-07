// Database row types (match Supabase schema)
export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    website_url: string | null;
    domain: string | null;
    color: string;
    created_at: string;
    updated_at: string;
}

export type NodeType = 'pillar' | 'cluster' | 'supporting' | 'planned' | 'external';
export type NodeStatus = 'planned' | 'writing' | 'published' | 'needs_update';

export interface ContentNode {
    id: string;
    project_id: string;
    node_type: NodeType;
    title: string;
    slug: string | null;
    url: string | null;
    target_keyword: string | null;
    status: NodeStatus;
    notes: string | null;
    word_count_target: number | null;
    assigned_to: string | null;
    publish_date: string | null;
    position_x: number;
    position_y: number;
    color: string | null;
    created_at: string;
    updated_at: string;
}

export type EdgeType = 'hierarchy' | 'sibling' | 'cross_cluster' | 'outbound' | 'backlink';

export interface ContentEdge {
    id: string;
    project_id: string;
    source_node_id: string;
    target_node_id: string;
    source_handle_id: string | null;
    target_handle_id: string | null;
    edge_type: EdgeType;
    label: string | null;
    stroke_width: number | null;
    arrow_size: number | null;
    line_style: 'solid' | 'dashed' | 'dotted' | null;
    created_at: string;
}

export interface Article {
    id: string;
    node_id: string;
    project_id: string;
    content: string | null;
    word_count: number;
    seo_title: string | null;
    seo_description: string | null;
    created_at: string;
    updated_at: string;
}

export interface CanvasSettings {
    id: string;
    project_id: string;
    viewport_x: number;
    viewport_y: number;
    viewport_zoom: number;
    show_labels: boolean;
    snap_to_grid: boolean;
    grid_size: number;
    updated_at: string;
}

// React Flow adapted types
export interface CanvasNode {
    id: string;
    type: NodeType;
    position: { x: number; y: number };
    data: Omit<ContentNode, 'id' | 'position_x' | 'position_y'>;
}

export interface CanvasEdge {
    id: string;
    source: string;
    target: string;
    type: EdgeType;
    label?: string;
    data: Omit<ContentEdge, 'id' | 'source_node_id' | 'target_node_id'>;
}

// Form types
export interface CreateProjectInput {
    name: string;
    description?: string;
    website_url?: string;
    domain?: string;
    color?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
    id: string;
}

export interface CreateNodeInput {
    project_id: string;
    node_type: NodeType;
    title: string;
    position_x: number;
    position_y: number;
    target_keyword?: string;
    status?: NodeStatus;
}

export interface UpdateNodeInput extends Partial<Omit<CreateNodeInput, 'project_id'>> {
    id: string;
}

export interface CreateEdgeInput {
    project_id: string;
    source_node_id: string;
    target_node_id: string;
    edge_type: EdgeType;
    label?: string;
}
