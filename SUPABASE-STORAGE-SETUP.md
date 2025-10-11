# Supabase Storage Setup for Documents

## Issue
Documents are not showing up in the admin dashboard because the Supabase storage bucket may not be configured properly.

## Steps to Set Up Storage

### 1. Create Storage Bucket in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Set bucket name: `documents`
5. Make it **Public** (so documents can be viewed)
6. Click **Create bucket**

### 2. Set Up Storage Policies

After creating the bucket, you need to set up RLS policies:

```sql
-- Allow authenticated users to upload documents
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

-- Allow public access to view documents
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');

-- Allow authenticated users to update their documents
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their documents
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);
```

### 3. Alternative: Check Current Data

If you want to see what's currently stored in your database, run this query in the Supabase SQL editor:

```sql
-- Check all students and their document data
SELECT 
  student_name,
  student_id,
  documents,
  documents_url,
  document_types,
  created_at
FROM students
ORDER BY created_at DESC;
```

### 4. Manual Fix for Existing Data

If you have students with documents in the old format, run this to convert them:

```sql
-- Convert old document format to new format
UPDATE students 
SET 
  documents_url = CASE 
    WHEN documents IS NOT NULL AND jsonb_array_length(documents) > 0 
    THEN (
      SELECT array_agg(doc->>'url') 
      FROM jsonb_array_elements(documents) AS doc
    )
    ELSE NULL 
  END,
  document_types = CASE 
    WHEN documents IS NOT NULL AND jsonb_array_length(documents) > 0 
    THEN (
      SELECT array_agg(COALESCE(doc->>'type', 'other')) 
      FROM jsonb_array_elements(documents) AS doc
    )
    ELSE NULL 
  END
WHERE documents IS NOT NULL;
```

## Quick Test

To test if storage is working, try uploading a simple file through the Supabase dashboard:

1. Go to Storage > documents bucket
2. Click **Upload file**
3. Upload any test file
4. Check if you can view it with the public URL

## Troubleshooting

### If documents still don't show:

1. **Check browser console** for any errors
2. **Verify bucket exists** in Supabase dashboard
3. **Check RLS policies** are set correctly
4. **Test with a new student** to see if new uploads work
5. **Check the actual database data** using the SQL query above

### Common Issues:

- **Bucket doesn't exist**: Create it in Supabase dashboard
- **RLS blocking access**: Set up proper policies
- **Old data format**: Run the conversion SQL
- **Network issues**: Check if Supabase is accessible

## Next Steps

1. Set up the storage bucket
2. Test with a new student upload
3. Check if documents appear in admin dashboard
4. If needed, convert existing data using the SQL query