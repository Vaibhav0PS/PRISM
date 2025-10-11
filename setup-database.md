# Database Setup Instructions

The registration is hanging because the database tables haven't been created yet. Here's how to fix it:

## Option 1: Quick Fix (Recommended)

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `pdpblpontpaamkbcryeg`
3. **Go to SQL Editor** (left sidebar)
4. **Copy and paste the entire contents** of `database-schema-fixed.sql`
5. **Click "Run"** to execute the SQL

## Option 2: Manual Steps

If you prefer to do it step by step:

1. **Create the basic users table first**:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user role enum
DO $ BEGIN
    CREATE TYPE user_role AS ENUM ('school_admin', 'donor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

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

-- Create basic policy
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);
```

2. **Test registration** - it should work now
3. **Run the full schema** from `database-schema-fixed.sql` to get all features

## What's Happening

- Supabase Auth works fine (creates users in `auth.users`)
- But our app tries to create a profile in `public.users` table
- That table doesn't exist yet, so the registration hangs
- Once you create the table, registration will work

## After Setup

Once the database is set up:
1. **Remove the test components** from the registration page
2. **Test registration** with a real email
3. **Check that you can log in**
4. **Access the school dashboard**

The database schema includes:
- ✅ Users table (for profiles)
- ✅ Schools table (for school registration)
- ✅ Requests table (for funding requests)
- ✅ Row Level Security (RLS) policies
- ✅ All necessary indexes and constraints