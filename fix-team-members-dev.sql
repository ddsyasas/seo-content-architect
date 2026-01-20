-- =====================================================
-- FIX: Ensure project owners are in team_members table
-- Run this in your DEV Supabase SQL Editor
-- =====================================================

-- Step 1: Check current state
SELECT 'CURRENT STATE' as check_type;

SELECT
    p.id as project_id,
    p.name as project_name,
    p.user_id as owner_id,
    tm.role as team_role,
    CASE WHEN tm.id IS NULL THEN '❌ MISSING' ELSE '✅ EXISTS' END as status
FROM projects p
LEFT JOIN team_members tm ON tm.project_id = p.id AND tm.user_id = p.user_id;

-- Step 2: Add missing owners to team_members
INSERT INTO team_members (project_id, user_id, role)
SELECT p.id, p.user_id, 'owner'
FROM projects p
WHERE NOT EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.project_id = p.id AND tm.user_id = p.user_id
)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Step 3: Verify fix
SELECT 'AFTER FIX' as check_type;

SELECT
    p.id as project_id,
    p.name as project_name,
    p.user_id as owner_id,
    tm.role as team_role,
    CASE WHEN tm.id IS NULL THEN '❌ MISSING' ELSE '✅ EXISTS' END as status
FROM projects p
LEFT JOIN team_members tm ON tm.project_id = p.id AND tm.user_id = p.user_id;

-- Step 4: Show all team members
SELECT 'ALL TEAM MEMBERS' as info;
SELECT
    tm.project_id,
    p.name as project_name,
    tm.user_id,
    pr.email as user_email,
    tm.role
FROM team_members tm
JOIN projects p ON p.id = tm.project_id
JOIN profiles pr ON pr.id = tm.user_id;

SELECT 'FIX COMPLETE! Try inviting team members again.' as result;
