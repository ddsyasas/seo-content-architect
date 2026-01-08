-- =============================================
-- FIX: Team Members RLS Policies
-- Run this in Supabase SQL Editor
-- This fixes the circular dependency in RLS
-- =============================================

-- Drop all existing team_members policies first
DROP POLICY IF EXISTS "Team members can view project team" ON team_members;
DROP POLICY IF EXISTS "Users can view teams they belong to" ON team_members;
DROP POLICY IF EXISTS "Owners and admins can add team members" ON team_members;
DROP POLICY IF EXISTS "Owners and admins can update team members" ON team_members;
DROP POLICY IF EXISTS "Owners and admins can remove team members" ON team_members;
DROP POLICY IF EXISTS "Project owners can add themselves" ON team_members;

-- Create simpler, non-circular policies

-- 1. Users can view their own team membership
CREATE POLICY "Users can view own team membership"
    ON team_members FOR SELECT
    USING (user_id = auth.uid());

-- 2. Users can view team members of projects they own
CREATE POLICY "Project owners can view all team members"
    ON team_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = team_members.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- 3. Project owners can add team members
CREATE POLICY "Project owners can add team members"
    ON team_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = team_members.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- 4. Project owners can update team members
CREATE POLICY "Project owners can update team members"
    ON team_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = team_members.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- 5. Project owners can delete team members (except themselves as owner)
CREATE POLICY "Project owners can delete team members"
    ON team_members FOR DELETE
    USING (
        role != 'owner' AND
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = team_members.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Also add the missing owner entries to team_members for existing projects
INSERT INTO team_members (project_id, user_id, role)
SELECT p.id, p.user_id, 'owner'
FROM projects p
WHERE NOT EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.project_id = p.id 
    AND tm.user_id = p.user_id
)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Verify the backfill worked
SELECT 
    p.name as project_name, 
    tm.role, 
    pr.email as user_email
FROM projects p
JOIN team_members tm ON tm.project_id = p.id
JOIN profiles pr ON pr.id = tm.user_id
ORDER BY p.created_at;
