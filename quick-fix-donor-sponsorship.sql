-- Quick fix for donor sponsorship functionality
-- Run this in your Supabase SQL Editor

-- 1. Create some sample funding requests for verified schools
INSERT INTO requests (school_id, title, description, type, amount_estimate, status, created_at)
SELECT 
  s.id,
  'Student Scholarship Program - ' || s.name,
  'Seeking funding to support deserving students with scholarships for their education. This includes tuition fees, books, uniforms, and other educational expenses.',
  'scholarship',
  50000,
  'listed',
  NOW()
FROM schools s
WHERE s.verified = true
  AND NOT EXISTS (
    SELECT 1 FROM requests r WHERE r.school_id = s.id AND r.type = 'scholarship'
  );

-- 2. Verify we have requests now
SELECT 
  r.title,
  r.type,
  r.amount_estimate,
  r.status,
  s.name as school_name,
  s.verified
FROM requests r
JOIN schools s ON r.school_id = s.id
WHERE s.verified = true
ORDER BY r.created_at DESC;

-- 3. Check interests table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'interests' 
ORDER BY ordinal_position;

-- 4. Test interests insert (this should work with existing schema)
-- Don't run this, just verify the structure matches what the app expects