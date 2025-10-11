-- Fix Student Documents Data Format
-- Run this in your Supabase SQL Editor

-- First, let's see what data we currently have
SELECT 
  id,
  student_name,
  student_id,
  documents,
  documents_url,
  document_types,
  created_at
FROM students
ORDER BY created_at DESC;

-- Check if we have any documents in the old format
SELECT 
  COUNT(*) as students_with_old_documents
FROM students 
WHERE documents IS NOT NULL 
  AND (documents_url IS NULL OR array_length(documents_url, 1) IS NULL);

-- Fix the data format for students with documents in old format
-- This handles both JSON objects and arrays

-- First, let's handle the case where documents is a JSON array
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
  END
WHERE documents IS NOT NULL 
  AND (documents_url IS NULL OR array_length(documents_url, 1) IS NULL);

-- Alternative: If documents are stored as simple text arrays, try this:
UPDATE students 
SET 
  documents_url = CASE 
    WHEN documents IS NOT NULL AND documents_url IS NULL
    THEN string_to_array(documents::text, ',')
    ELSE documents_url
  END,
  document_types = CASE 
    WHEN documents IS NOT NULL AND document_types IS NULL
    THEN array_fill('other'::text, ARRAY[array_length(string_to_array(documents::text, ','), 1)])
    ELSE document_types
  END
WHERE documents IS NOT NULL 
  AND documents_url IS NULL;

-- Verify the fix worked
SELECT 
  id,
  student_name,
  student_id,
  array_length(documents_url, 1) as url_count,
  array_length(document_types, 1) as type_count,
  documents_url,
  document_types
FROM students
WHERE documents_url IS NOT NULL
ORDER BY created_at DESC;

-- Clean up old documents field (optional - only run after verifying the fix worked)
-- UPDATE students SET documents = NULL WHERE documents_url IS NOT NULL;