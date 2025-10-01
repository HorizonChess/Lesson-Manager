-- Migration: Simplify subjects architecture
-- Remove school_subjects junction table, add user_id directly to subjects
-- This makes subjects work like tags in the materials system

-- Step 1: Add user_id column to subjects (nullable initially)
ALTER TABLE subjects ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Step 2: Populate user_id for existing subjects based on school_subjects relationships
UPDATE subjects
SET user_id = (
  SELECT s.user_id
  FROM school_subjects ss
  INNER JOIN schools s ON s.id = ss.school_id
  WHERE ss.subject_id = subjects.id
  LIMIT 1
)
WHERE user_id IS NULL;

-- Step 3: For any orphaned subjects (no school_subjects), delete them
-- They are leftover from failed operations and have no owner
DELETE FROM subjects WHERE user_id IS NULL;

-- Step 4: Make user_id required for future subjects
ALTER TABLE subjects ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Drop the school_subjects junction table (no longer needed)
-- Foreign keys will be removed automatically
DROP TABLE school_subjects;

-- Step 6: Update RLS policies to be simple user_id checks
DROP POLICY IF EXISTS subjects_select_policy ON subjects;
DROP POLICY IF EXISTS subjects_insert_policy ON subjects;
DROP POLICY IF EXISTS subjects_update_policy ON subjects;
DROP POLICY IF EXISTS subjects_delete_policy ON subjects;

CREATE POLICY subjects_select_policy ON subjects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY subjects_insert_policy ON subjects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY subjects_update_policy ON subjects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY subjects_delete_policy ON subjects
  FOR DELETE USING (user_id = auth.uid());

-- Step 7: Add index on user_id for performance
CREATE INDEX idx_subjects_user_id ON subjects(user_id);

-- Verification queries (optional - for manual checking)
-- SELECT 'Subjects count' as check_name, COUNT(*) as count FROM subjects;
-- SELECT 'Groups with null subject_id' as check_name, COUNT(*) as count FROM groups WHERE subject_id IS NULL;
-- SELECT 'Subjects without user_id' as check_name, COUNT(*) as count FROM subjects WHERE user_id IS NULL;
