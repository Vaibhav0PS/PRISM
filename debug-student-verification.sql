-- Debug student verification status
-- Run this in your Supabase SQL Editor

-- 1. Check all students for the school "vit" (or any school)
SELECT 
  s.student_name,
  s.student_id,
  s.class_grade,
  s.scholarship_eligible,
  s.created_at,
  sch.name as school_name,
  sch.udise_id
FROM students s
JOIN schools sch ON s.school_id = sch.id
WHERE sch.name ILIKE '%vit%' OR sch.udise_id = '12345678904'
ORDER BY s.created_at DESC;

-- 2. Check all students across all verified schools
SELECT 
  sch.name as school_name,
  sch.udise_id,
  sch.verified as school_verified,
  COUNT(s.id) as total_students,
  COUNT(CASE WHEN s.scholarship_eligible = true THEN 1 END) as verified_students
FROM schools sch
LEFT JOIN students s ON sch.id = s.school_id
WHERE sch.verified = true
GROUP BY sch.id, sch.name, sch.udise_id, sch.verified
ORDER BY sch.name;

-- 3. Show all students that need verification
SELECT 
  s.student_name,
  s.student_id,
  s.class_grade,
  s.scholarship_eligible,
  sch.name as school_name,
  sch.udise_id,
  s.documents_url,
  s.document_types
FROM students s
JOIN schools sch ON s.school_id = sch.id
WHERE sch.verified = true 
  AND (s.scholarship_eligible = false OR s.scholarship_eligible IS NULL)
ORDER BY sch.name, s.student_name;

-- 4. Quick fix: Verify all students with documents (OPTIONAL - only run if you want to verify all at once)
-- UPDATE students 
-- SET scholarship_eligible = true 
-- WHERE scholarship_eligible = false 
--   AND (documents_url IS NOT NULL AND array_length(documents_url, 1) > 0);

-- 5. Summary counts
SELECT 
  'Total verified schools' as metric,
  COUNT(*) as count
FROM schools 
WHERE verified = true

UNION ALL

SELECT 
  'Total students in verified schools' as metric,
  COUNT(*) as count
FROM students s
JOIN schools sch ON s.school_id = sch.id
WHERE sch.verified = true

UNION ALL

SELECT 
  'Verified students (visible to donors)' as metric,
  COUNT(*) as count
FROM students s
JOIN schools sch ON s.school_id = sch.id
WHERE sch.verified = true 
  AND s.scholarship_eligible = true;