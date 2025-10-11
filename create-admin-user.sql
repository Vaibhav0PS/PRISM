-- Create Admin User Script
-- Run this in Supabase SQL Editor after setting up the main schema

-- Step 1: First register a user normally through the app, then get their ID
-- Step 2: Update their role to admin using their user ID

-- Example: Update user role to admin (replace 'your-user-id' with actual ID)
UPDATE public.users 
SET role = 'admin' 
WHERE id = 'your-user-id-here';

-- Or if you know the email:
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, name, role, created_at 
FROM public.users 
WHERE role = 'admin';