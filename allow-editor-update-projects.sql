-- Allow Editors to UPDATE projects (edit project settings)
-- Run this in Supabase SQL Editor

-- Add policy for team members (editors) to update projects they're assigned to
DROP POLICY IF EXISTS "projects_team_update" ON projects;

CREATE POLICY "projects_team_update" ON projects FOR UPDATE
USING (
    id IN (
        SELECT project_id FROM team_members 
        WHERE user_id = auth.uid() 
        AND role = 'editor'
    )
);

SELECT 'Editors can now update project settings!' as result;
