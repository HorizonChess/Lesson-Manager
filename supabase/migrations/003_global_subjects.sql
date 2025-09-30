-- Migration: Transform subjects from school-specific to global
-- Phase 1: Database schema modification for subjects overhaul

-- Step 1: Create school_subjects junction table
CREATE TABLE school_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(school_id, subject_id)
);

-- Enable RLS on school_subjects table
ALTER TABLE school_subjects ENABLE ROW LEVEL SECURITY;

-- RLS policies for school_subjects (users can only see their own school assignments)
CREATE POLICY school_subjects_select_policy ON school_subjects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM schools
      WHERE schools.id = school_subjects.school_id
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY school_subjects_insert_policy ON school_subjects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM schools
      WHERE schools.id = school_subjects.school_id
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY school_subjects_update_policy ON school_subjects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM schools
      WHERE schools.id = school_subjects.school_id
      AND schools.user_id = auth.uid()
    )
  );

CREATE POLICY school_subjects_delete_policy ON school_subjects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM schools
      WHERE schools.id = school_subjects.school_id
      AND schools.user_id = auth.uid()
    )
  );

-- Step 2: Migrate existing data to junction table
-- This preserves current school-subject relationships
INSERT INTO school_subjects (school_id, subject_id)
SELECT DISTINCT school_id, id
FROM subjects;

-- Step 3: Create global subjects by consolidating duplicates
-- First, create a temporary table to map old subject IDs to new consolidated IDs
CREATE TEMP TABLE subject_mapping AS
WITH consolidated_subjects AS (
  -- Group subjects by name and select the first one as the "canonical" subject
  SELECT
    name,
    MIN(id) as canonical_id,
    ARRAY_AGG(id) as all_ids
  FROM subjects
  GROUP BY LOWER(TRIM(name))
),
subject_map AS (
  SELECT
    unnest(cs.all_ids) as old_id,
    cs.canonical_id as new_id,
    cs.name
  FROM consolidated_subjects cs
)
SELECT * FROM subject_map;

-- Step 4: Update groups table to use consolidated subject IDs
UPDATE groups
SET subject_id = sm.new_id
FROM subject_mapping sm
WHERE groups.subject_id = sm.old_id;

-- Step 5: Update school_subjects to use consolidated subject IDs
UPDATE school_subjects
SET subject_id = sm.new_id
FROM subject_mapping sm
WHERE school_subjects.subject_id = sm.old_id;

-- Remove duplicate school_subjects entries that may have been created
DELETE FROM school_subjects a USING school_subjects b
WHERE a.id > b.id
AND a.school_id = b.school_id
AND a.subject_id = b.subject_id;

-- Step 6: Delete duplicate subjects (keep only canonical ones)
DELETE FROM subjects
WHERE id NOT IN (
  SELECT DISTINCT new_id FROM subject_mapping
);

-- Step 7: Remove school_id column from subjects table
-- First, drop the foreign key constraint
ALTER TABLE subjects DROP CONSTRAINT subjects_school_id_fkey;

-- Drop the school_id column
ALTER TABLE subjects DROP COLUMN school_id;

-- Step 8: Update RLS policies for subjects (now global)
-- Drop old school-based policies
DROP POLICY subjects_select_policy ON subjects;
DROP POLICY subjects_insert_policy ON subjects;
DROP POLICY subjects_update_policy ON subjects;
DROP POLICY subjects_delete_policy ON subjects;

-- Create new user-based policies for global subjects
-- Users can see all subjects (global), but can only modify subjects they're using
CREATE POLICY subjects_select_policy ON subjects
  FOR SELECT USING (
    -- Users can see all global subjects
    true
  );

CREATE POLICY subjects_insert_policy ON subjects
  FOR INSERT WITH CHECK (
    -- Users can create new global subjects
    auth.uid() IS NOT NULL
  );

CREATE POLICY subjects_update_policy ON subjects
  FOR UPDATE USING (
    -- Users can only update subjects they're actually using in their schools
    EXISTS (
      SELECT 1 FROM school_subjects ss
      INNER JOIN schools s ON s.id = ss.school_id
      WHERE ss.subject_id = subjects.id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY subjects_delete_policy ON subjects
  FOR DELETE USING (
    -- Users can only delete subjects they're using and that aren't used by other schools
    EXISTS (
      SELECT 1 FROM school_subjects ss
      INNER JOIN schools s ON s.id = ss.school_id
      WHERE ss.subject_id = subjects.id
      AND s.user_id = auth.uid()
    )
    AND NOT EXISTS (
      -- Ensure no other users are using this subject
      SELECT 1 FROM school_subjects ss
      INNER JOIN schools s ON s.id = ss.school_id
      WHERE ss.subject_id = subjects.id
      AND s.user_id != auth.uid()
    )
  );

-- Step 9: Add indexes for performance
CREATE INDEX idx_school_subjects_school_id ON school_subjects(school_id);
CREATE INDEX idx_school_subjects_subject_id ON school_subjects(subject_id);
CREATE INDEX idx_subjects_name ON subjects(name);