-- =====================================================
-- Update edge types for SEO Link Architecture
-- Run this in the Supabase SQL Editor
-- =====================================================

-- This migration updates the edge_type values to match the new SEO-focused types:
-- 'hierarchy' - Parent ↔ Child structural links
-- 'sibling' - Same-level article connections
-- 'cross_cluster' - Links between different topic clusters
-- 'outbound' - Links from your content to external sites
-- 'backlink' - Links from external sites to your content

-- First, remove the unique constraint to allow multiple edges (if not done already)
ALTER TABLE edges DROP CONSTRAINT IF EXISTS edges_source_node_id_target_node_id_edge_type_key;

-- Update any existing edges with old types to the new 'sibling' type
UPDATE edges SET edge_type = 'sibling' WHERE edge_type = 'internal_link';
UPDATE edges SET edge_type = 'cross_cluster' WHERE edge_type = 'planned_link';
UPDATE edges SET edge_type = 'outbound' WHERE edge_type = 'external_link';

-- Add a comment describing valid edge_type values
COMMENT ON COLUMN edges.edge_type IS 'Valid types: hierarchy, sibling, cross_cluster, outbound, backlink';

-- Optional: Add new node_type 'supporting' for bottom-level content
COMMENT ON COLUMN nodes.node_type IS 'Valid types: pillar, cluster, supporting, planned, external';
