-- FIX: Infinite recursion in projects RLS policy
-- The can_access_project function causes recursion when used on projects table
-- Run this in Supabase SQL Editor

-- Drop the problematic policies
DROP POLICY IF EXISTS "Owners can manage projects" ON projects;
DROP POLICY IF EXISTS "Team members can view assigned projects" ON projects;
DROP POLICY IF EXISTS "Users can CRUD own projects" ON projects;

-- Create simple owner policy (no function call to avoid recursion)
CREATE POLICY "Owners can manage projects"
ON projects FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Team members can VIEW projects they're assigned to (direct query, no function)
CREATE POLICY "Team members can view assigned projects"
ON projects FOR SELECT
USING (
    id IN (
        SELECT project_id FROM team_members WHERE user_id = auth.uid()
    )
);

SELECT 'Fixed! Try creating a project now.';
