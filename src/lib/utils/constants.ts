// Node type colors
export const NODE_COLORS = {
    pillar: {
        bg: '#EEF2FF',
        border: '#6366F1',
        text: '#3730A3',
    },
    cluster: {
        bg: '#EFF6FF',
        border: '#3B82F6',
        text: '#1E40AF',
    },
    planned: {
        bg: '#F9FAFB',
        border: '#9CA3AF',
        text: '#374151',
    },
    external: {
        bg: '#ECFDF5',
        border: '#10B981',
        text: '#065F46',
    },
} as const;

// Status colors
export const STATUS_COLORS = {
    planned: '#9CA3AF',
    writing: '#FBBF24',
    published: '#10B981',
    needs_update: '#F97316',
} as const;

// Status labels
export const STATUS_LABELS = {
    planned: 'Planned',
    writing: 'Writing',
    published: 'Published',
    needs_update: 'Needs Update',
} as const;

// Node type labels
export const NODE_TYPE_LABELS = {
    pillar: 'Pillar',
    cluster: 'Cluster',
    supporting: 'Supporting',
    planned: 'Planned',
    external: 'External',
} as const;

// Edge type labels
export const EDGE_TYPE_LABELS = {
    hierarchy: 'Hierarchy Link',
    sibling: 'Sibling Link',
    cross_cluster: 'Cross-Cluster Link',
    outbound: 'Outbound Link',
    backlink: 'Backlink',
} as const;

// Edge type styles
export const EDGE_STYLES = {
    hierarchy: { stroke: '#3B82F6', strokeWidth: 3, strokeDasharray: undefined },
    sibling: { stroke: '#93C5FD', strokeWidth: 2, strokeDasharray: undefined },
    cross_cluster: { stroke: '#8B5CF6', strokeWidth: 2, strokeDasharray: '8,4' },
    outbound: { stroke: '#9CA3AF', strokeWidth: 2, strokeDasharray: '4,4' },
    backlink: { stroke: '#10B981', strokeWidth: 2, strokeDasharray: '4,4' },
} as const;

// Default project colors
export const PROJECT_COLORS = [
    '#6366F1', // Indigo
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4', // Cyan
] as const;

