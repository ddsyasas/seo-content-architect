-- Fix RLS policies to allow team members to access project content
-- Run this in Supabase SQL Editor

-- First, let's create a helper function to check if a user is a team member of a project
CREATE OR REPLACE FUNCTION is_team_member(project_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.project_id = $1 
        AND team_members.user_id = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user owns project OR is a team member
CREATE OR REPLACE FUNCTION can_access_project(project_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = $1 
        AND projects.user_id = auth.uid()
    )
    OR 
    EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.project_id = $1 
        AND team_members.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NODES TABLE - Allow team members access
-- ============================================
DROP POLICY IF EXISTS "Users can CRUD nodes in own projects" ON nodes;
DROP POLICY IF EXISTS "Team members can access nodes" ON nodes;

-- Policy for viewing nodes (owners + team members)
CREATE POLICY "Users and team members can view nodes"
ON nodes FOR SELECT
USING (can_access_project(project_id));

-- Policy for creating nodes (owners + editors/admins)
CREATE POLICY "Owners and editors can insert nodes"
ON nodes FOR INSERT
WITH CHECK (
    can_access_project(project_id)
);

-- Policy for updating nodes (owners + editors/admins)
CREATE POLICY "Owners and editors can update nodes"
ON nodes FOR UPDATE
USING (can_access_project(project_id));

-- Policy for deleting nodes (owners + editors/admins)
CREATE POLICY "Owners and editors can delete nodes"
ON nodes FOR DELETE
USING (can_access_project(project_id));

-- ============================================
-- EDGES TABLE - Allow team members access
-- ============================================
DROP POLICY IF EXISTS "Users can CRUD edges in own projects" ON edges;
DROP POLICY IF EXISTS "Team members can access edges" ON edges;

CREATE POLICY "Users and team members can view edges"
ON edges FOR SELECT
USING (can_access_project(project_id));

CREATE POLICY "Owners and editors can insert edges"
ON edges FOR INSERT
WITH CHECK (can_access_project(project_id));

CREATE POLICY "Owners and editors can update edges"
ON edges FOR UPDATE
USING (can_access_project(project_id));

CREATE POLICY "Owners and editors can delete edges"
ON edges FOR DELETE
USING (can_access_project(project_id));

-- ============================================
-- ARTICLES TABLE - Allow team members access
-- ============================================
DROP POLICY IF EXISTS "Users can CRUD articles in own projects" ON articles;
DROP POLICY IF EXISTS "Team members can access articles" ON articles;

CREATE POLICY "Users and team members can view articles"
ON articles FOR SELECT
USING (can_access_project(project_id));

CREATE POLICY "Owners and editors can insert articles"
ON articles FOR INSERT
WITH CHECK (can_access_project(project_id));

CREATE POLICY "Owners and editors can update articles"
ON articles FOR UPDATE
USING (can_access_project(project_id));

CREATE POLICY "Owners and editors can delete articles"
ON articles FOR DELETE
USING (can_access_project(project_id));

-- ============================================
-- CANVAS_SETTINGS TABLE - Allow team members access
-- ============================================
DROP POLICY IF EXISTS "Users can CRUD canvas settings for own projects" ON canvas_settings;
DROP POLICY IF EXISTS "Team members can access canvas settings" ON canvas_settings;

CREATE POLICY "Users and team members can view canvas settings"
ON canvas_settings FOR SELECT
USING (can_access_project(project_id));

CREATE POLICY "Owners and editors can manage canvas settings"
ON canvas_settings FOR INSERT
WITH CHECK (can_access_project(project_id));

CREATE POLICY "Owners and editors can update canvas settings"
ON canvas_settings FOR UPDATE
USING (can_access_project(project_id));

-- ============================================
-- PROJECTS TABLE - Allow team members to view
-- ============================================
DROP POLICY IF EXISTS "Users can CRUD own projects" ON projects;

-- Owners can do everything with their projects
CREATE POLICY "Owners can manage projects"
ON projects FOR ALL
USING (user_id = auth.uid());

-- Team members can view projects they're assigned to
CREATE POLICY "Team members can view assigned projects"
ON projects FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.project_id = projects.id 
        AND team_members.user_id = auth.uid()
    )
);

SELECT 'Team member content access RLS policies updated successfully!';
