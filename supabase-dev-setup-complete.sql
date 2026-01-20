-- =====================================================
-- SEO Content Architect - COMPLETE DATABASE SETUP
-- For Development Environment
-- =====================================================
-- Generated: January 20, 2026
-- Run this ENTIRE script in Supabase SQL Editor (new dev project)
-- =====================================================

-- =====================================================
-- PART 1: CORE TABLES (from supabase-schema.sql)
-- =====================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own projects" ON projects;
CREATE POLICY "Users can CRUD own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- 3. NODES TABLE
CREATE TABLE IF NOT EXISTS nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL DEFAULT 'cluster',
  title TEXT NOT NULL,
  slug TEXT,
  url TEXT,
  target_keyword TEXT,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  word_count_target INTEGER,
  assigned_to TEXT,
  publish_date DATE,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD nodes in own projects" ON nodes;
CREATE POLICY "Users can CRUD nodes in own projects" ON nodes
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_nodes_project_id ON nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_nodes_node_type ON nodes(node_type);

-- 4. EDGES TABLE
CREATE TABLE IF NOT EXISTS edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL DEFAULT 'internal_link',
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD edges in own projects" ON edges;
CREATE POLICY "Users can CRUD edges in own projects" ON edges
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_edges_project_id ON edges(project_id);
CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_node_id);

-- 5. CANVAS_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS canvas_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  viewport_x FLOAT DEFAULT 0,
  viewport_y FLOAT DEFAULT 0,
  viewport_zoom FLOAT DEFAULT 1,
  show_labels BOOLEAN DEFAULT true,
  snap_to_grid BOOLEAN DEFAULT false,
  grid_size INTEGER DEFAULT 20,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE canvas_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD canvas settings for own projects" ON canvas_settings;
CREATE POLICY "Users can CRUD canvas settings for own projects" ON canvas_settings
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- PART 2: CORE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_nodes_updated_at ON nodes;
CREATE TRIGGER update_nodes_updated_at
  BEFORE UPDATE ON nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_canvas_settings_updated_at ON canvas_settings;
CREATE TRIGGER update_canvas_settings_updated_at
  BEFORE UPDATE ON canvas_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create canvas settings when project is created
CREATE OR REPLACE FUNCTION handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO canvas_settings (project_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_project_created ON projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION handle_new_project();

-- =====================================================
-- PART 3: BUSINESS TABLES (from supabase-business-tables.sql)
-- =====================================================

-- SUBSCRIPTIONS TABLE
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

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- TEAM MEMBERS TABLE
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

CREATE INDEX IF NOT EXISTS idx_team_members_project ON team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

-- TEAM INVITATIONS TABLE
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

CREATE INDEX IF NOT EXISTS idx_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_project ON team_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON team_invitations(email);

-- Add stripe_customer_id to profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;
    END IF;
END $$;

-- Auto-create subscription on user signup
CREATE OR REPLACE FUNCTION public.create_subscription_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, plan, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_create_subscription ON public.profiles;
CREATE TRIGGER on_profile_created_create_subscription
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_subscription_for_new_user();

-- Auto-add owner to team_members on project creation
CREATE OR REPLACE FUNCTION public.add_owner_to_team_on_project_create()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.team_members (project_id, user_id, role)
    VALUES (NEW.id, NEW.user_id, 'owner')
    ON CONFLICT (project_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_project_created_add_owner ON public.projects;
CREATE TRIGGER on_project_created_add_owner
    AFTER INSERT ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.add_owner_to_team_on_project_create();

-- Auto-update updated_at on subscription changes
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

-- Enable RLS on business tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- SUBSCRIPTIONS POLICIES
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

-- TEAM MEMBERS POLICIES
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

-- TEAM INVITATIONS POLICIES
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

-- =====================================================
-- PART 4: ARTICLES TABLE (from supabase-articles-migration.sql)
-- =====================================================

-- Add domain column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain TEXT;
COMMENT ON COLUMN projects.domain IS 'Visual domain for URL previews (e.g., example.com). Not an actual DNS connection.';

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT,
  word_count INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(node_id)
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD articles in own projects" ON articles;
CREATE POLICY "Users can CRUD articles in own projects" ON articles
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_articles_project_id ON articles(project_id);
CREATE INDEX IF NOT EXISTS idx_articles_node_id ON articles(node_id);

CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_articles_updated_at();

-- =====================================================
-- PART 5: EDGE ENHANCEMENTS
-- =====================================================

-- Remove unique constraint to allow multiple edges
ALTER TABLE edges DROP CONSTRAINT IF EXISTS edges_source_node_id_target_node_id_edge_type_key;

-- Update edge types for SEO
UPDATE edges SET edge_type = 'sibling' WHERE edge_type = 'internal_link';
UPDATE edges SET edge_type = 'cross_cluster' WHERE edge_type = 'planned_link';
UPDATE edges SET edge_type = 'outbound' WHERE edge_type = 'external_link';

COMMENT ON COLUMN edges.edge_type IS 'Valid types: hierarchy, sibling, cross_cluster, outbound, backlink';
COMMENT ON COLUMN nodes.node_type IS 'Valid types: pillar, cluster, supporting, planned, external';

-- Add handle persistence columns
ALTER TABLE edges ADD COLUMN IF NOT EXISTS source_handle_id TEXT;
ALTER TABLE edges ADD COLUMN IF NOT EXISTS target_handle_id TEXT;
ALTER TABLE edges ADD COLUMN IF NOT EXISTS stroke_width INTEGER DEFAULT 2;
ALTER TABLE edges ADD COLUMN IF NOT EXISTS arrow_size INTEGER DEFAULT 16;
ALTER TABLE edges ADD COLUMN IF NOT EXISTS line_style TEXT DEFAULT 'solid';

COMMENT ON COLUMN edges.source_handle_id IS 'React Flow handle ID on source node (top, bottom, left, right)';
COMMENT ON COLUMN edges.target_handle_id IS 'React Flow handle ID on target node (top, bottom, left, right)';

-- =====================================================
-- PART 6: STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-images');

DROP POLICY IF EXISTS "Public can view article images" ON storage.objects;
CREATE POLICY "Public can view article images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'article-images');

DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'article-images');

-- =====================================================
-- PART 7: FIX SIGNUP (from supabase-fix-signup.sql)
-- =====================================================

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- PART 8: RLS HELPER FUNCTION (from fix-rls-with-function.sql)
-- =====================================================

CREATE OR REPLACE FUNCTION user_accessible_project_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT id FROM projects WHERE user_id = auth.uid()
    UNION
    SELECT project_id FROM team_members WHERE user_id = auth.uid()
$$;

-- Recreate policies using the helper function
DROP POLICY IF EXISTS "articles_access" ON articles;
CREATE POLICY "articles_access" ON articles FOR ALL
USING (project_id IN (SELECT user_accessible_project_ids()));

DROP POLICY IF EXISTS "nodes_access" ON nodes;
CREATE POLICY "nodes_access" ON nodes FOR ALL
USING (project_id IN (SELECT user_accessible_project_ids()));

DROP POLICY IF EXISTS "edges_access" ON edges;
CREATE POLICY "edges_access" ON edges FOR ALL
USING (project_id IN (SELECT user_accessible_project_ids()));

DROP POLICY IF EXISTS "canvas_settings_access" ON canvas_settings;
CREATE POLICY "canvas_settings_access" ON canvas_settings FOR ALL
USING (project_id IN (SELECT user_accessible_project_ids()));

-- =====================================================
-- PART 9: FINAL RLS FIXES
-- =====================================================

-- Projects team view policy
DROP POLICY IF EXISTS "projects_team_view" ON projects;
CREATE POLICY "projects_team_view" ON projects FOR SELECT
USING (id IN (SELECT user_accessible_project_ids()));

-- Allow editors to update projects
DROP POLICY IF EXISTS "projects_team_update" ON projects;
CREATE POLICY "projects_team_update" ON projects FOR UPDATE
USING (
    id IN (
        SELECT project_id FROM team_members
        WHERE user_id = auth.uid()
        AND role = 'editor'
    )
);

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'DATABASE SETUP COMPLETE!' as status;
SELECT
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
    'Tables created successfully' as message;
