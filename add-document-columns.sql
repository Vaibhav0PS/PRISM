-- Add missing document columns to students table
-- Run this in your Supabase SQL Editor first

-- Check current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add the missing columns
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS documents_url TEXT[] DEFAULT '{}';

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS document_types TEXT[] DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_documents_url ON public.students USING GIN(documents_url);
CREATE INDEX IF NOT EXISTS idx_students_document_types ON public.students USING GIN(document_types);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND table_schema = 'public'
  AND column_name IN ('documents_url', 'document_types')
ORDER BY ordinal_position;

-- Success message
DO $$ BEGIN
    RAISE NOTICE '✅ Document columns added successfully!';
    RAISE NOTICE '📄 documents_url: Array of document URLs';
    RAISE NOTICE '🏷️ document_types: Array of document types';
END $$;