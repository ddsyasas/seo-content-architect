-- STEP 1: VERIFY YOUR DATA EXISTS
-- Run this first to confirm data is there
SELECT 'Projects count:' as info, COUNT(*) as count FROM projects;
SELECT 'Articles count:' as info, COUNT(*) as count FROM articles;
SELECT 'Nodes count:' as info, COUNT(*) as count FROM nodes;

-- STEP 2: CHECK CURRENT RLS STATUS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('projects', 'articles', 'nodes', 'edges');

-- STEP 3: CHECK ALL POLICIES
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
