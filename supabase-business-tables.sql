-- =============================================
-- SEO Architect Business Infrastructure Tables
-- Run this in Supabase SQL Editor
-- SAFE TO RE-RUN - Drops and recreates policies
-- =============================================

-- 1. SUBSCRIPTIONS TABLE
-- Tracks user subscription status and Stripe IDs
-- =============================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'agency')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id)
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 2. TEAM MEMBERS TABLE
-- Tracks project team membership and roles
-- =============================================

CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    invited_by UUID REFERENCES profiles(id),
    joined_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT team_members_unique_membership UNIQUE (project_id, user_id)
);

-- Indexes for team_members
CREATE INDEX IF NOT EXISTS idx_team_members_project ON team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

-- 3. TEAM INVITATIONS TABLE
-- Tracks pending team invitations
-- =============================================

CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    invited_by UUID NOT NULL REFERENCES profiles(id),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for team_invitations
CREATE INDEX IF NOT EXISTS idx_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_project ON team_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON team_invitations(email);

-- 4. ADD STRIPE CUSTOMER ID TO PROFILES
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;
    END IF;
END $$;

-- =============================================
-- TRIGGERS
-- =============================================

-- 5. Auto-create subscription on user signup
-- =============================================

CREATE OR REPLACE FUNCTION public.create_subscription_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, plan, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_profile_created_create_subscription ON public.profiles;
CREATE TRIGGER on_profile_created_create_subscription
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_subscription_for_new_user();

-- 6. Auto-add owner to team_members on project creation
-- =============================================

CREATE OR REPLACE FUNCTION public.add_owner_to_team_on_project_create()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.team_members (project_id, user_id, role)
    VALUES (NEW.id, NEW.user_id, 'owner')
    ON CONFLICT (project_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_project_created_add_owner ON public.projects;
CREATE TRIGGER on_project_created_add_owner
    AFTER INSERT ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.add_owner_to_team_on_project_create();

-- 7. Auto-update updated_at on subscription changes
-- =============================================

CREATE OR REPLACE FUNCTION public.update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_subscription_update ON public.subscriptions;
CREATE TRIGGER on_subscription_update
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscription_updated_at();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- Drop existing policies first (safe to re-run)
-- =============================================

-- Enable RLS on new tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- 8. SUBSCRIPTIONS POLICIES - Drop existing first
-- =============================================

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;

CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
    ON subscriptions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- 9. TEAM MEMBERS POLICIES - Drop existing first
-- =============================================

DROP POLICY IF EXISTS "Team members can view project team" ON team_members;
DROP POLICY IF EXISTS "Users can view teams they belong to" ON team_members;
DROP POLICY IF EXISTS "Owners and admins can add team members" ON team_members;
DROP POLICY IF EXISTS "Owners and admins can update team members" ON team_members;
DROP POLICY IF EXISTS "Owners and admins can remove team members" ON team_members;

CREATE POLICY "Team members can view project team"
    ON team_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members tm 
            WHERE tm.project_id = team_members.project_id 
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view teams they belong to"
    ON team_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Owners and admins can add team members"
    ON team_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members tm 
            WHERE tm.project_id = team_members.project_id 
            AND tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners and admins can update team members"
    ON team_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM team_members tm 
            WHERE tm.project_id = team_members.project_id 
            AND tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners and admins can remove team members"
    ON team_members FOR DELETE
    USING (
        team_members.role != 'owner' AND
        EXISTS (
            SELECT 1 FROM team_members tm 
            WHERE tm.project_id = team_members.project_id 
            AND tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin')
        )
    );

-- 10. TEAM INVITATIONS POLICIES - Drop existing first
-- =============================================

DROP POLICY IF EXISTS "Owners and admins can view project invitations" ON team_invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON team_invitations;
DROP POLICY IF EXISTS "Owners and admins can create invitations" ON team_invitations;
DROP POLICY IF EXISTS "Owners and admins can delete invitations" ON team_invitations;
DROP POLICY IF EXISTS "Invitees can accept invitations" ON team_invitations;

CREATE POLICY "Owners and admins can view project invitations"
    ON team_invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members tm 
            WHERE tm.project_id = team_invitations.project_id 
            AND tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Anyone can view invitation by token"
    ON team_invitations FOR SELECT
    USING (token IS NOT NULL);

CREATE POLICY "Owners and admins can create invitations"
    ON team_invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members tm 
            WHERE tm.project_id = team_invitations.project_id 
            AND tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners and admins can delete invitations"
    ON team_invitations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM team_members tm 
            WHERE tm.project_id = team_invitations.project_id 
            AND tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Invitees can accept invitations"
    ON team_invitations FOR UPDATE
    USING (token IS NOT NULL);

-- =============================================
-- BACKFILL EXISTING DATA
-- =============================================

-- Create subscriptions for existing users who don't have one
INSERT INTO subscriptions (user_id, plan, status)
SELECT id, 'free', 'active'
FROM profiles
WHERE id NOT IN (SELECT user_id FROM subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- Add existing project owners to team_members
INSERT INTO team_members (project_id, user_id, role)
SELECT id, user_id, 'owner'
FROM projects
WHERE (id, user_id) NOT IN (SELECT project_id, user_id FROM team_members)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- =============================================
-- VERIFICATION - Run this to confirm it worked
-- =============================================
-- SELECT 'subscriptions' as table_name, count(*) FROM subscriptions
-- UNION ALL
-- SELECT 'team_members', count(*) FROM team_members
-- UNION ALL
-- SELECT 'team_invitations', count(*) FROM team_invitations;
