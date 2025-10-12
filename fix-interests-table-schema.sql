-- Fix interests table schema for donor sponsorship
-- Run this in your Supabase SQL Editor

-- 1. First check current interests table structure
\d interests;

-- 2. Add missing columns to interests table
ALTER TABLE interests 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id),
ADD COLUMN IF NOT EXISTS student_ids UUID[],
ADD COLUMN IF NOT EXISTS commitment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS commitment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Create impact_updates table if it doesn't exist
CREATE TABLE IF NOT EXISTS impact_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interest_id UUID REFERENCES interests(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  title TEXT NOT NULL,
  description TEXT,
  update_type TEXT CHECK (update_type IN ('infrastructure', 'student_progress', 'completion', 'general')),
  progress_photos TEXT[],
  student_reports TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS on impact_updates
ALTER TABLE impact_updates ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for impact_updates
CREATE POLICY "Public can view impact updates" ON impact_updates
  FOR SELECT USING (true);

CREATE POLICY "Schools can manage their impact updates" ON impact_updates
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM schools WHERE id = impact_updates.school_id
    )
  );

CREATE POLICY "Admins can manage all impact updates" ON impact_updates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Update interests table RLS to allow school_id based queries
DROP POLICY IF EXISTS "Users can view interests" ON interests;
CREATE POLICY "Users can view interests" ON interests
  FOR SELECT USING (
    donor_id = auth.uid() OR 
    request_id IN (SELECT id FROM requests WHERE school_id IN (SELECT id FROM schools WHERE user_id = auth.uid())) OR
    school_id IN (SELECT id FROM schools WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Donors can create interests" ON interests;
CREATE POLICY "Donors can create interests" ON interests
  FOR INSERT WITH CHECK (
    donor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'donor')
  );

-- 7. Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'interests' 
ORDER BY ordinal_position;

-- 8. Test query that was failing
SELECT 
  i.*,
  s.name as school_name,
  s.udise_id,
  s.location
FROM interests i
LEFT JOIN schools s ON i.school_id = s.id
WHERE i.donor_id = 'f2454eb7-5739-423e-a306-79283771af9f'
  AND i.status = 'committed'
ORDER BY i.created_at DESC;