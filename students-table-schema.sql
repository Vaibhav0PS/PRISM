-- Students Table Schema
-- Add this to your existing database schema

-- Students table for document management
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_name TEXT NOT NULL,
    student_id TEXT NOT NULL, -- School's internal student ID
    class_grade TEXT NOT NULL,
    father_name TEXT,
    mother_name TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    category TEXT CHECK (category IN ('general', 'obc', 'sc', 'st', 'other')),
    phone_number TEXT,
    address TEXT,
    documents_url TEXT[] DEFAULT '{}', -- Array of document URLs
    document_types TEXT[] DEFAULT '{}', -- Array of document types
    scholarship_eligible BOOLEAN DEFAULT FALSE,
    scholarship_amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, student_id) -- Unique student ID per school
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_grade ON public.students(class_grade);
CREATE INDEX IF NOT EXISTS idx_students_scholarship_eligible ON public.students(scholarship_eligible);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students
DROP POLICY IF EXISTS "School admins can manage their students" ON public.students;
CREATE POLICY "School admins can manage their students" ON public.students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.schools 
            WHERE id = school_id AND admin_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
CREATE POLICY "Admins can view all students" ON public.students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create updated_at trigger for students
DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON public.students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$ BEGIN
    RAISE NOTICE '✅ Students table created successfully!';
    RAISE NOTICE '📚 Schools can now manage student documents and scholarships';
END $$;