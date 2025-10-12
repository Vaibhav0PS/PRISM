-- Test query to find students for VIT school specifically
-- Run this in Supabase SQL Editor

-- Find the VIT school ID first
SELECT id, name, udise_id, verified 
FROM schools 
WHERE name ILIKE '%vit%' OR udise_id = '12345678904';

-- Find students for VIT school using the exact same query as the app
SELECT 
  s.*,
  sch.name as school_name,
  sch.udise_id
FROM students s
JOIN schools sch ON s.school_id = sch.id
WHERE sch.name ILIKE '%vit%' 
  AND s.scholarship_eligible = true
ORDER BY s.created_at DESC;

-- Alternative: Find by UDISE ID
SELECT 
  s.*,
  sch.name as school_name,
  sch.udise_id
FROM students s
JOIN schools sch ON s.school_id = sch.id
WHERE sch.udise_id = '12345678904'
  AND s.scholarship_eligible = true
ORDER BY s.created_at DESC;

-- Check all students for VIT (regardless of verification status)
SELECT 
  s.student_name,
  s.student_id,
  s.scholarship_eligible,
  sch.name as school_name,
  sch.udise_id
FROM students s
JOIN schools sch ON s.school_id = sch.id
WHERE sch.name ILIKE '%vit%'
ORDER BY s.created_at DESC;