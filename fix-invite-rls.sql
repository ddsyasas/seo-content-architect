-- =============================================
-- FIX: Allow invited users to add themselves to team_members
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Invited users can add themselves" ON team_members;

-- Allow users to insert themselves if they have a valid invitation
CREATE POLICY "Invited users can add themselves"
    ON team_members FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM team_invitations 
            WHERE team_invitations.project_id = team_members.project_id 
            AND team_invitations.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND team_invitations.accepted_at IS NULL
            AND team_invitations.expires_at > NOW()
        )
    );

-- Also allow the user to view their own team membership after joining
DROP POLICY IF EXISTS "Users can view own team membership" ON team_members;
CREATE POLICY "Users can view own team membership"
    ON team_members FOR SELECT
    USING (user_id = auth.uid());
