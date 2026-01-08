-- =============================================
-- COMPREHENSIVE FIX: Team Members RLS Policies
-- Run this ENTIRE script in Supabase SQL Editor
-- =============================================

-- First, disable RLS temporarily to clean up
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on team_members
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'team_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON team_members', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policy 1: Project owners can do everything
CREATE POLICY "Project owners can manage team"
    ON team_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = team_members.project_id 
            AND projects.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = team_members.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Policy 2: Users can view their own team memberships
CREATE POLICY "Users can view own memberships"
    ON team_members FOR SELECT
    USING (user_id = auth.uid());

-- Policy 3: Invited users can add themselves (crucial for accepting invitations)
CREATE POLICY "Invited users can join teams"
    ON team_members FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM team_invitations ti
            WHERE ti.project_id = team_members.project_id
            AND LOWER(ti.email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
            AND ti.accepted_at IS NULL
            AND ti.expires_at > NOW()
        )
    );

-- Also ensure team_invitations RLS allows reading/updating
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing invitation policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'team_invitations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON team_invitations', pol.policyname);
    END LOOP;
END $$;

-- Anyone can read invitations (needed to see invitation details via token)
CREATE POLICY "Anyone can read invitations"
    ON team_invitations FOR SELECT
    USING (true);

-- Project owners can manage invitations
CREATE POLICY "Project owners can manage invitations"
    ON team_invitations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = team_invitations.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Invited users can update their own invitations (mark as accepted)
CREATE POLICY "Users can accept their invitations"
    ON team_invitations FOR UPDATE
    USING (
        LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
    WITH CHECK (
        LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    );

SELECT 'RLS policies updated successfully!' as result;
