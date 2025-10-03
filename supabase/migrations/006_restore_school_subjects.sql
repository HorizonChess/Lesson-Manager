-- Migration: Restore school_subjects junction table
-- This fixes the architecture to match Materials/Tags pattern
-- Schools ↔ SchoolSubjects (junction) ↔ Subjects

-- Step 1: Create school_subjects junction table
CREATE TABLE school_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, subject_id)
);

-- Step 2: Enable RLS
ALTER TABLE school_subjects ENABLE ROW LEVEL SECURITY;

-- Step 3: RLS policies (users can only link their own schools to subjects)
CREATE POLICY school_subjects_select_policy ON school_subjects
  FOR SELECT USING (
    school_id IN (SELECT id FROM schools WHERE user_id = auth.uid())
  );

CREATE POLICY school_subjects_insert_policy ON school_subjects
  FOR INSERT WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE user_id = auth.uid())
  );

CREATE POLICY school_subjects_delete_policy ON school_subjects
  FOR DELETE USING (
    school_id IN (SELECT id FROM schools WHERE user_id = auth.uid())
  );

-- Step 4: Create indexes for performance
CREATE INDEX idx_school_subjects_school_id ON school_subjects(school_id);
CREATE INDEX idx_school_subjects_subject_id ON school_subjects(subject_id);

-- Step 5: Populate from existing groups (derive current school-subject relationships)
INSERT INTO school_subjects (school_id, subject_id)
SELECT DISTINCT g.school_id, g.subject_id
FROM groups g
ON CONFLICT (school_id, subject_id) DO NOTHING;

-- Verification
-- SELECT 'School-Subject links' as check_name, COUNT(*) as count FROM school_subjects;
