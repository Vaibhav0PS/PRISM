-- Create Impact Updates Table for Donor Dashboard
-- Run this in your Supabase SQL Editor

-- Create impact_updates table
CREATE TABLE IF NOT EXISTS public.impact_updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    interest_id UUID REFERENCES public.interests(id) ON DELETE CASCADE NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    donor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    update_type TEXT CHECK (update_type IN ('infrastructure', 'student_progress', 'completion', 'general')) DEFAULT 'general',
    progress_photos TEXT[] DEFAULT '{}', -- Array of photo URLs
    student_reports JSONB DEFAULT '[]', -- Array of student report objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_impact_updates_interest_id ON public.impact_updates(interest_id);
CREATE INDEX IF NOT EXISTS idx_impact_updates_school_id ON public.impact_updates(school_id);
CREATE INDEX IF NOT EXISTS idx_impact_updates_donor_id ON public.impact_updates(donor_id);
CREATE INDEX IF NOT EXISTS idx_impact_updates_created_at ON public.impact_updates(created_at);

-- Enable RLS
ALTER TABLE public.impact_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for impact_updates
DROP POLICY IF EXISTS "Schools can manage their impact updates" ON public.impact_updates;
CREATE POLICY "Schools can manage their impact updates" ON public.impact_updates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.schools 
            WHERE id = school_id AND admin_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Donors can view their impact updates" ON public.impact_updates;
CREATE POLICY "Donors can view their impact updates" ON public.impact_updates
    FOR SELECT USING (donor_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all impact updates" ON public.impact_updates;
CREATE POLICY "Admins can view all impact updates" ON public.impact_updates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create updated_at trigger for impact_updates
DROP TRIGGER IF EXISTS update_impact_updates_updated_at ON public.impact_updates;
CREATE TRIGGER update_impact_updates_updated_at 
    BEFORE UPDATE ON public.impact_updates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data structure for student_reports JSONB field:
-- [
--   {
--     "student_name": "John Doe",
--     "student_id": "12345",
--     "grade": "A+",
--     "subject": "Mathematics",
--     "document_url": "https://...",
--     "report_type": "marksheet"
--   }
-- ]

-- Verify the table was created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'impact_updates' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
DO $$ BEGIN
    RAISE NOTICE '✅ Impact Updates table created successfully!';
    RAISE NOTICE '📊 Donors can now track the impact of their donations';
    RAISE NOTICE '📸 Schools can upload progress photos and student reports';
    RAISE NOTICE '🎯 Complete transparency in donation impact tracking';
END $$;