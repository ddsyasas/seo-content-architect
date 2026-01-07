-- =====================================================
-- Add handle IDs to edges table for persistent connections
-- Run this in the Supabase SQL Editor
-- =====================================================

-- Add columns to store which handle each edge connects to
ALTER TABLE edges ADD COLUMN IF NOT EXISTS source_handle_id TEXT;
ALTER TABLE edges ADD COLUMN IF NOT EXISTS target_handle_id TEXT;

-- Add columns for custom edge styling (optional)
ALTER TABLE edges ADD COLUMN IF NOT EXISTS stroke_width INTEGER DEFAULT 2;
ALTER TABLE edges ADD COLUMN IF NOT EXISTS arrow_size INTEGER DEFAULT 16;
ALTER TABLE edges ADD COLUMN IF NOT EXISTS line_style TEXT DEFAULT 'solid';

-- Drop the unique constraint that prevents multiple edges between same nodes
-- (if not already done)
ALTER TABLE edges DROP CONSTRAINT IF EXISTS edges_source_node_id_target_node_id_edge_type_key;

COMMENT ON COLUMN edges.source_handle_id IS 'React Flow handle ID on source node (top, bottom, left, right)';
COMMENT ON COLUMN edges.target_handle_id IS 'React Flow handle ID on target node (top, bottom, left, right)';
