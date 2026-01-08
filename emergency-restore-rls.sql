-- EMERGENCY RESTORE: Fix all RLS policies
-- Run this ENTIRE script in Supabase SQL Editor immediately
-- Your data is SAFE - this just fixes visibility

-- ============================================
-- STEP 1: FIX PROJECTS TABLE
-- ============================================

-- Drop all policies on projects
DROP POLICY IF EXISTS "projects_owner_all" ON projects;
DROP POLICY IF EXISTS "projects_team_view" ON projects;
DROP POLICY IF EXISTS "Team members can view assigned projects" ON projects;
DROP POLICY IF EXISTS "Owners can manage projects" ON projects;
DROP POLICY IF EXISTS "Users can CRUD own projects" ON projects;
DROP POLICY IF EXISTS "owner_full_access" ON projects;

-- Create owner policy (full access)
CREATE POLICY "projects_owner_all" ON projects FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create team member read policy
CREATE POLICY "projects_team_view" ON projects FOR SELECT
USING (id IN (SELECT project_id FROM team_members WHERE user_id = auth.uid()));

-- ============================================
-- STEP 2: FIX NODES TABLE
-- ============================================

DROP POLICY IF EXISTS "nodes_access" ON nodes;
DROP POLICY IF EXISTS "Users can CRUD nodes in own projects" ON nodes;

CREATE POLICY "nodes_access" ON nodes FOR ALL
USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM team_members WHERE user_id = auth.uid())
);

-- ============================================
-- STEP 3: FIX ARTICLES TABLE
-- ============================================

DROP POLICY IF EXISTS "articles_access" ON articles;
DROP POLICY IF EXISTS "Users can CRUD articles in own projects" ON articles;

CREATE POLICY "articles_access" ON articles FOR ALL
USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM team_members WHERE user_id = auth.uid())
);

-- ============================================
-- STEP 4: FIX EDGES TABLE
-- ============================================

DROP POLICY IF EXISTS "edges_access" ON edges;
DROP POLICY IF EXISTS "Users can CRUD edges in own projects" ON edges;

CREATE POLICY "edges_access" ON edges FOR ALL
USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM team_members WHERE user_id = auth.uid())
);

-- ============================================
-- STEP 5: FIX CANVAS_SETTINGS TABLE
-- ============================================

DROP POLICY IF EXISTS "canvas_settings_access" ON canvas_settings;

CREATE POLICY "canvas_settings_access" ON canvas_settings FOR ALL
USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM team_members WHERE user_id = auth.uid())
);

-- ============================================
-- DONE!
-- ============================================

SELECT 'ALL POLICIES RESTORED! Refresh your browser.' as result;
