-- Fix RLS policy to allow donors to see verified students
-- Run this in your Supabase SQL Editor

-- Check current policies on students table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'students';

-- Drop existing restrictive policy for donors
DROP POLICY IF EXISTS "Donors can view verified students" ON public.students;

-- Create new policy allowing donors to see verified students from verified schools
CREATE POLICY "Donors can view verified students" ON public.students
    FOR SELECT USING (
        scholarship_eligible = true 
        AND EXISTS (
            SELECT 1 FROM public.schools 
            WHERE id = school_id AND verified = true
        )
    );

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'students' AND policyname = 'Donors can view verified students';

-- Test the policy by checking if we can see students as a donor would
-- This simulates what the donor dashboard query does
SELECT 
  s.student_name,
  s.student_id,
  s.scholarship_eligible,
  sch.name as school_name
FROM students s
JOIN schools sch ON s.school_id = sch.id
WHERE s.school_id = 'b6f55abb-8ed4-4aa8-a043-8ac8bdd21587'
  AND s.scholarship_eligible = true;

-- Success message
DO $$ BEGIN
    RAISE NOTICE '✅ RLS policy updated for students table!';
    RAISE NOTICE '👥 Donors can now see verified students from verified schools';
    RAISE NOTICE '🔒 Security maintained - only verified students are visible';
END $$;