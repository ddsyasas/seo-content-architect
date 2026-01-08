-- FIX CIRCULAR RLS with SECURITY DEFINER function
-- Run this ENTIRE script in Supabase SQL Editor

-- Step 1: Create a helper function that bypasses RLS
CREATE OR REPLACE FUNCTION user_accessible_project_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    -- Projects user owns
    SELECT id FROM projects WHERE user_id = auth.uid()
    UNION
    -- Projects user is team member of
    SELECT project_id FROM team_members WHERE user_id = auth.uid()
$$;

-- Step 2: Recreate articles policy using the function
DROP POLICY IF EXISTS "articles_access" ON articles;
CREATE POLICY "articles_access" ON articles FOR ALL
USING (project_id IN (SELECT user_accessible_project_ids()));

-- Step 3: Recreate nodes policy using the function
DROP POLICY IF EXISTS "nodes_access" ON nodes;
CREATE POLICY "nodes_access" ON nodes FOR ALL
USING (project_id IN (SELECT user_accessible_project_ids()));

-- Step 4: Recreate edges policy using the function
DROP POLICY IF EXISTS "edges_access" ON edges;
CREATE POLICY "edges_access" ON edges FOR ALL
USING (project_id IN (SELECT user_accessible_project_ids()));

-- Step 5: Recreate canvas_settings policy using the function
DROP POLICY IF EXISTS "canvas_settings_access" ON canvas_settings;
CREATE POLICY "canvas_settings_access" ON canvas_settings FOR ALL
USING (project_id IN (SELECT user_accessible_project_ids()));

-- Done
SELECT 'FIXED! Refresh your browser now.' as result;
