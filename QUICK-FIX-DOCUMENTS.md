# Quick Fix for Document Columns

## Problem
The error "column students.documents_url does not exist" means your students table was created before the document columns were added to the schema.

## Solution

### Step 1: Add Missing Columns
Go to your **Supabase Dashboard** → **SQL Editor** and run this:

```sql
-- Add missing document columns
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS documents_url TEXT[] DEFAULT '{}';

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS document_types TEXT[] DEFAULT '{}';

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name IN ('documents_url', 'document_types');
```

### Step 2: Test the Fix
After running the SQL:
1. Go to your **School Dashboard**
2. Click **"Fix Documents"** button
3. Check if students now show document counts

### Step 3: Verify in Admin Dashboard
1. Go to **Admin Dashboard** → **Students** tab
2. Students should now show documents with view/download links
3. You can verify students to make them visible to donors

## Alternative: Complete Table Recreation

If the above doesn't work, you can recreate the table with all columns:

```sql
-- Backup existing data
CREATE TABLE students_backup AS SELECT * FROM students;

-- Drop and recreate table with correct schema
DROP TABLE students CASCADE;

-- Run the complete students-table-schema.sql file
-- Then restore data:
INSERT INTO students (
  school_id, student_name, student_id, class_grade, 
  father_name, mother_name, date_of_birth, gender, 
  category, phone_number, address, scholarship_eligible, 
  scholarship_amount, created_at
)
SELECT 
  school_id, student_name, student_id, class_grade,
  father_name, mother_name, date_of_birth, gender,
  category, phone_number, address, scholarship_eligible,
  scholarship_amount, created_at
FROM students_backup;

-- Drop backup table
DROP TABLE students_backup;
```

## What Should Happen After Fix:
- ✅ Students show document counts in School Dashboard
- ✅ Documents appear with view/download links in Admin Dashboard  
- ✅ Admin can verify students for donor visibility
- ✅ New document uploads work correctly