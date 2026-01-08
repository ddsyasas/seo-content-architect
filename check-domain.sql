-- Check if the project has a domain
SELECT id, name, domain FROM projects;

-- Check the helper function is working
SELECT * FROM user_accessible_project_ids();
