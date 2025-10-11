-- EduLink Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('school_admin', 'donor', 'admin');
CREATE TYPE school_category AS ENUM ('rural', 'tribal', 'urban');
CREATE TYPE request_type AS ENUM ('scholarship', 'infrastructure');
CREATE TYPE request_status AS ENUM ('pending', 'verified', 'approved', 'listed', 'completed');
CREATE TYPE interest_status AS ENUM ('interested', 'contacted', 'committed', 'completed');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'donor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schools table
CREATE TABLE public.schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    udise_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    category school_category NOT NULL,
    region TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    documents_url TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requests table
CREATE TABLE public.requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    type request_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    amount_estimate DECIMAL(10,2) NOT NULL,
    status request_status DEFAULT 'pending',
    documents_url TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Updates table (for progress tracking)
CREATE TABLE public.updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT,
    progress_percent INTEGER CHECK (progress_percent >= 0 AND progress_percent <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interests table (donor interest in requests)
CREATE TABLE public.interests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    donor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
    message TEXT,
    status interest_status DEFAULT 'interested',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(donor_id, request_id)
);

-- Create indexes for better performance
CREATE INDEX idx_schools_admin_id ON public.schools(admin_id);
CREATE INDEX idx_schools_verified ON public.schools(verified);
CREATE INDEX idx_schools_category ON public.schools(category);
CREATE INDEX idx_requests_school_id ON public.requests(school_id);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_type ON public.requests(type);
CREATE INDEX idx_updates_request_id ON public.updates(request_id);
CREATE INDEX idx_interests_donor_id ON public.interests(donor_id);
CREATE INDEX idx_interests_request_id ON public.interests(request_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for requests table
CREATE TRIGGER update_requests_updated_at 
    BEFORE UPDATE ON public.requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Schools policies
CREATE POLICY "Anyone can view verified schools" ON public.schools
    FOR SELECT USING (verified = true);

CREATE POLICY "School admins can view their own schools" ON public.schools
    FOR SELECT USING (auth.uid() = admin_id);

CREATE POLICY "School admins can insert their own schools" ON public.schools
    FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "School admins can update their own schools" ON public.schools
    FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY "Admins can view all schools" ON public.schools
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Requests policies
CREATE POLICY "Anyone can view approved/listed requests" ON public.requests
    FOR SELECT USING (status IN ('approved', 'listed', 'completed'));

CREATE POLICY "School admins can view their own requests" ON public.requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.schools 
            WHERE id = school_id AND admin_id = auth.uid()
        )
    );

CREATE POLICY "School admins can insert requests for their schools" ON public.requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.schools 
            WHERE id = school_id AND admin_id = auth.uid()
        )
    );

CREATE POLICY "School admins can update their own requests" ON public.requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.schools 
            WHERE id = school_id AND admin_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all requests" ON public.requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Updates policies
CREATE POLICY "Anyone can view updates for approved requests" ON public.updates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.requests 
            WHERE id = request_id AND status IN ('approved', 'listed', 'completed')
        )
    );

CREATE POLICY "School admins can manage updates for their requests" ON public.updates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.requests r
            JOIN public.schools s ON r.school_id = s.id
            WHERE r.id = request_id AND s.admin_id = auth.uid()
        )
    );

-- Interests policies
CREATE POLICY "Donors can view their own interests" ON public.interests
    FOR SELECT USING (auth.uid() = donor_id);

CREATE POLICY "Donors can insert their own interests" ON public.interests
    FOR INSERT WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can update their own interests" ON public.interests
    FOR UPDATE USING (auth.uid() = donor_id);

CREATE POLICY "School admins can view interests in their requests" ON public.interests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.requests r
            JOIN public.schools s ON r.school_id = s.id
            WHERE r.id = request_id AND s.admin_id = auth.uid()
        )
    );

-- Insert sample data (optional)
-- You can run this after creating a few test accounts

-- Sample admin user (replace with actual user ID after registration)
-- INSERT INTO public.users (id, name, email, role) VALUES 
-- ('your-admin-user-id', 'Admin User', 'admin@edulink.com', 'admin');

-- Enable realtime for live updates (optional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.updates;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.interests;