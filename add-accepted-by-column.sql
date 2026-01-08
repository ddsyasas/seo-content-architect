-- Add accepted_by column to team_invitations to track which user accepted t invitation
-- Run this in Supabase SQL Editor

ALTER TABLE team_invitations 
ADD COLUMN IF NOT EXISTS accepted_by uuid REFERENCES auth.users(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_invitations_accepted_by 
ON team_invitations(accepted_by) 
WHERE accepted_by IS NOT NULL;

-- Add unique constraint on project_id and user_id in team_members
-- This allows us to use upsert
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'team_members_project_user_unique'
    ) THEN
        ALTER TABLE team_members 
        ADD CONSTRAINT team_members_project_user_unique 
        UNIQUE (project_id, user_id);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Constraint might already exist with different name
    NULL;
END $$;

SELECT 'Migration complete! accepted_by column added to team_invitations';
