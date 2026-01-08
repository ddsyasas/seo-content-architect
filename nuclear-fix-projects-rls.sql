-- FORCE FIX: Use CASCADE to drop everything
-- Run this ENTIRE script in Supabase SQL Editor
-- This is SAFE - policies are just access rules, NOT your data

-- Step 1: List current policies (for debugging)
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'projects' AND schemaname = 'public';

-- Step 2: Force drop the functions with CASCADE (this removes dependent policies too)
DROP FUNCTION IF EXISTS can_access_project(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_team_member(uuid, uuid) CASCADE;

-- Step 3: Make sure no policies exist on projects
DROP POLICY IF EXISTS "projects_owner_all" ON projects;
DROP POLICY IF EXISTS "projects_team_view" ON projects;
DROP POLICY IF EXISTS "projects_team_select" ON projects;

-- Step 4: Create ONE simple policy for projects
CREATE POLICY "projects_owner_all" ON projects FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 5: Create one simple policy for team viewing
CREATE POLICY "projects_team_view" ON projects FOR SELECT
USING (id IN (SELECT project_id FROM team_members WHERE user_id = auth.uid()));

-- Step 6: Simple policies for other tables (no function calls!)
DROP POLICY IF EXISTS "nodes_access" ON nodes;
DROP POLICY IF EXISTS "edges_access" ON edges;
DROP POLICY IF EXISTS "articles_access" ON articles;
DROP POLICY IF EXISTS "canvas_settings_access" ON canvas_settings;

CREATE POLICY "nodes_access" ON nodes FOR ALL
USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM team_members WHERE user_id = auth.uid())
);

CREATE POLICY "edges_access" ON edges FOR ALL
USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM team_members WHERE user_id = auth.uid())
);

CREATE POLICY "articles_access" ON articles FOR ALL
USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM team_members WHERE user_id = auth.uid())
);

CREATE POLICY "canvas_settings_access" ON canvas_settings FOR ALL
USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM team_members WHERE user_id = auth.uid())
);

-- Done
SELECT 'SUCCESS! Policies reset with CASCADE.' as result;

-- Verify: Show current policies on projects
SELECT policyname FROM pg_policies WHERE tablename = 'projects' AND schemaname = 'public';
