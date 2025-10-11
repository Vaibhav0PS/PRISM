# 🚨 URGENT: Database Setup Required

## The Problem
Your registration is stuck because the database tables don't exist in Supabase yet.

## SOLUTION: You got the "user_role already exists" error!

This means you partially ran the schema. Here's how to complete it:

### Option 1: Quick Fix (Just Get Registration Working)
1. Go to: https://supabase.com/dashboard
2. Select your project: `pdpblpontpaamkbcryeg`
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. Copy the ENTIRE contents of `minimal-users-table.sql` file
6. Paste it into the SQL editor
7. Click **"Run"** (or press Ctrl+Enter)
8. ✅ Registration should work immediately!

### Option 2: Full Setup (All Features)
1. Same steps as above, but use `database-schema-clean.sql` instead
2. This handles existing objects gracefully
3. Gives you all platform features

## Alternative: Minimal Setup (if full schema fails)

If the full schema gives errors, run this minimal version first:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('school_admin', 'donor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'donor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for user registration
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);
```

## What This Fixes
- ✅ Registration will complete successfully
- ✅ Users can create accounts
- ✅ Database Status will show "READY"
- ✅ School dashboard will work

## After Database Setup
1. Refresh the registration page
2. Try creating an account
3. It should work immediately!

**This is the only thing blocking your registration right now.**