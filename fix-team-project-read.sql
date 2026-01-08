-- FIX: Allow team members to read project data (including domain)
-- Run this in Supabase SQL Editor (Production)

-- Step 1: Check if the policy exists
SELECT policyname FROM pg_policies 
WHERE tablename = 'projects' AND schemaname = 'public';

-- Step 2: Drop existing team view policy if it exists
DROP POLICY IF EXISTS "projects_team_view" ON projects;
DROP POLICY IF EXISTS "Team members can view assigned projects" ON projects;

-- Step 3: Create the policy allowing team members to SELECT projects they're assigned to
CREATE POLICY "projects_team_view" ON projects FOR SELECT
USING (
    id IN (SELECT project_id FROM team_members WHERE user_id = auth.uid())
);

-- Step 4: Verify
SELECT 'Team members can now read project domain!' as result;

-- List all policies on projects table
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'projects' AND schemaname = 'public';
