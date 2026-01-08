-- FIX: Projects RLS not using the helper function
-- Run this in Supabase SQL Editor

-- Drop the current team view policy on projects
DROP POLICY IF EXISTS "projects_team_view" ON projects;

-- Create new policy using the helper function
CREATE POLICY "projects_team_view" ON projects FOR SELECT
USING (id IN (SELECT user_accessible_project_ids()));

-- Done
SELECT 'Projects policy updated! Refresh browser.' as result;
