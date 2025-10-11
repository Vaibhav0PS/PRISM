-- Complete fix for students table
-- Run this in your Supabase SQL Editor

-- Step 1: Add all missing columns
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS documents_url TEXT[] DEFAULT '{}';

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS document_types TEXT[] DEFAULT '{}';

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Create the update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 3: Drop existing trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON public.students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Verify all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND table_schema = 'public'
  AND column_name IN ('documents_url', 'document_types', 'updated_at')
ORDER BY column_name;

-- Step 5: Convert existing document data
UPDATE students 
SET 
  documents_url = CASE 
    WHEN documents IS NOT NULL AND jsonb_typeof(documents::jsonb) = 'array'
    THEN ARRAY(
      SELECT (doc->>'url')::text 
      FROM jsonb_array_elements(documents::jsonb) AS doc
      WHERE doc->>'url' IS NOT NULL
    )
    ELSE documents_url
  END,
  document_types = CASE 
    WHEN documents IS NOT NULL AND jsonb_typeof(documents::jsonb) = 'array'
    THEN ARRAY(
      SELECT COALESCE((doc->>'type')::text, 'other') 
      FROM jsonb_array_elements(documents::jsonb) AS doc
    )
    ELSE document_types
  END,
  updated_at = NOW()
WHERE documents IS NOT NULL;

-- Step 6: Verify the conversion worked
SELECT 
  student_name,
  student_id,
  array_length(documents_url, 1) as url_count,
  array_length(document_types, 1) as type_count,
  documents_url[1] as first_doc_url,
  document_types[1] as first_doc_type
FROM students 
WHERE documents_url IS NOT NULL 
  AND array_length(documents_url, 1) > 0
LIMIT 5;

-- Success message
DO $$ BEGIN
    RAISE NOTICE '✅ Students table fixed successfully!';
    RAISE NOTICE '📄 Added documents_url and document_types columns';
    RAISE NOTICE '⏰ Added updated_at column and trigger';
    RAISE NOTICE '🔄 Converted existing document data';
END $$;