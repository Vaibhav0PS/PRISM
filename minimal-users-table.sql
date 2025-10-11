-- Minimal setup to get registration working
-- Run this if you just want to test registration quickly

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user role enum (skip if exists)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('school_admin', 'donor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'user_role type already exists, skipping...';
END $$;

-- Create users table (the only one needed for registration)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'donor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Create essential policies for registration
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Success message
DO $$ BEGIN
    RAISE NOTICE '✅ Minimal users table setup completed!';
    RAISE NOTICE '🚀 Registration should work now!';
    RAISE NOTICE '📝 Run database-schema-clean.sql later for full features';
END $$;