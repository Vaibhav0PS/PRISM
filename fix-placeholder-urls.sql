-- Fix placeholder URLs to actual Supabase storage URLs
-- Run this if documents still show as "No docs"

-- First, let's see what URLs we have
SELECT 
  student_name,
  student_id,
  documents_url,
  document_types
FROM students 
WHERE documents_url IS NOT NULL 
  AND array_length(documents_url, 1) > 0;

-- Update placeholder URLs to actual storage URLs
-- Replace 'YOUR_SUPABASE_URL' with your actual Supabase project URL
UPDATE students 
SET documents_url = ARRAY(
  SELECT CASE 
    WHEN url LIKE 'placeholder-%' THEN 
      'https://YOUR_SUPABASE_URL.supabase.co/storage/v1/object/public/documents/student-documents/' || url || '.pdf'
    ELSE url
  END
  FROM unnest(documents_url) AS url
)
WHERE documents_url IS NOT NULL 
  AND array_length(documents_url, 1) > 0
  AND documents_url[1] LIKE 'placeholder-%';

-- Verify the update
SELECT 
  student_name,
  student_id,
  documents_url[1] as first_document_url,
  document_types[1] as first_document_type
FROM students 
WHERE documents_url IS NOT NULL 
  AND array_length(documents_url, 1) > 0;