-- Update interests table to support donor commitments
-- Run this in your Supabase SQL Editor

-- Add commitment_amount column to interests table
ALTER TABLE public.interests 
ADD COLUMN IF NOT EXISTS commitment_amount DECIMAL(10,2);

-- Add commitment_date column to track when donor committed
ALTER TABLE public.interests 
ADD COLUMN IF NOT EXISTS commitment_date TIMESTAMP WITH TIME ZONE;

-- Add school_id column for direct school sponsorship
ALTER TABLE public.interests 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- Add student_ids column to track which students are sponsored
ALTER TABLE public.interests 
ADD COLUMN IF NOT EXISTS student_ids UUID[];

-- Update the trigger to set commitment_date when status changes to committed
CREATE OR REPLACE FUNCTION update_commitment_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'committed' AND OLD.status != 'committed' THEN
        NEW.commitment_date = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for commitment date
DROP TRIGGER IF EXISTS set_commitment_date ON public.interests;
CREATE TRIGGER set_commitment_date
    BEFORE UPDATE ON public.interests
    FOR EACH ROW
    EXECUTE FUNCTION update_commitment_date();

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'interests' 
  AND table_schema = 'public'
  AND column_name IN ('commitment_amount', 'commitment_date')
ORDER BY column_name;

-- Success message
DO $$ BEGIN
    RAISE NOTICE '✅ Interests table updated successfully!';
    RAISE NOTICE '💰 Added commitment_amount column for donor funding commitments';
    RAISE NOTICE '📅 Added commitment_date column to track commitment timing';
END $$;