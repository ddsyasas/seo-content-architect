-- =====================================================
-- FIX: Allow multiple edges between the same nodes
-- Run this in the Supabase SQL Editor
-- =====================================================

-- Remove the UNIQUE constraint that limits edges between nodes
-- This allows complex SEO interlinking (multiple links between same pages)
ALTER TABLE edges DROP CONSTRAINT IF EXISTS edges_source_node_id_target_node_id_edge_type_key;

-- Now you can create multiple edges between any two nodes
-- Each edge can have different types: 'hierarchy', 'internal_link', 'planned_link', 'external_link'
