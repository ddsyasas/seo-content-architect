-- =====================================================
-- Add domain to projects and create articles table
-- Run this in the Supabase SQL Editor
-- =====================================================

-- 1. Add domain column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain TEXT;

COMMENT ON COLUMN projects.domain IS 'Visual domain for URL previews (e.g., example.com). Not an actual DNS connection.';

-- 2. Create articles table for storing content
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Article content
  content TEXT, -- Rich text/HTML content
  
  -- Metadata
  word_count INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One article per node
  UNIQUE(node_id)
);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can CRUD articles in their projects
DROP POLICY IF EXISTS "Users can CRUD articles in own projects" ON articles;
CREATE POLICY "Users can CRUD articles in own projects" ON articles
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_articles_project_id ON articles(project_id);
CREATE INDEX IF NOT EXISTS idx_articles_node_id ON articles(node_id);

-- 3. Add updated_at trigger for articles
CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_articles_updated_at();
