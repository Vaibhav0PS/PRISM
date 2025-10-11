-- Debug why donor dashboard shows fewer requests than verified schools
-- Run this in your Supabase SQL Editor

-- 1. Check all verified schools
SELECT 
  name,
  udise_id,
  verified,
  created_at
FROM schools 
WHERE verified = true
ORDER BY created_at DESC;

-- 2. Check all requests from verified schools
SELECT 
  r.title,
  r.status,
  r.type,
  r.amount_estimate,
  r.created_at,
  s.name as school_name,
  s.udise_id,
  s.verified as school_verified
FROM requests r
JOIN schools s ON r.school_id = s.id
WHERE s.verified = true
ORDER BY r.created_at DESC;

-- 3. Check requests that should appear in donor dashboard
SELECT 
  r.title,
  r.status,
  r.type,
  r.amount_estimate,
  r.created_at,
  s.name as school_name,
  s.udise_id,
  s.verified as school_verified
FROM requests r
JOIN schools s ON r.school_id = s.id
WHERE s.verified = true
  AND r.status IN ('approved', 'listed')
ORDER BY r.created_at DESC;

-- 4. Check what requests exist but are not approved yet
SELECT 
  r.title,
  r.status,
  r.type,
  r.created_at,
  s.name as school_name,
  s.verified as school_verified
FROM requests r
JOIN schools s ON r.school_id = s.id
WHERE s.verified = true
  AND r.status NOT IN ('approved', 'listed')
ORDER BY r.created_at DESC;

-- 5. Summary count
SELECT 
  'Total verified schools' as metric,
  COUNT(*) as count
FROM schools 
WHERE verified = true

UNION ALL

SELECT 
  'Total requests from verified schools' as metric,
  COUNT(*) as count
FROM requests r
JOIN schools s ON r.school_id = s.id
WHERE s.verified = true

UNION ALL

SELECT 
  'Approved requests (visible to donors)' as metric,
  COUNT(*) as count
FROM requests r
JOIN schools s ON r.school_id = s.id
WHERE s.verified = true
  AND r.status IN ('approved', 'listed');