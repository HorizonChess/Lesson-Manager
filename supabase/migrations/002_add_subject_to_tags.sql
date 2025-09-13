-- Add subject_id column to tags table
ALTER TABLE tags ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE;

-- Update the unique constraint to allow same tag names in different subjects
ALTER TABLE tags DROP CONSTRAINT tags_user_id_name_key;
ALTER TABLE tags ADD CONSTRAINT tags_user_id_name_subject_key UNIQUE(user_id, name, subject_id);

-- Update RLS policies to include subject checks
DROP POLICY tags_select_policy ON tags;
DROP POLICY tags_insert_policy ON tags;
DROP POLICY tags_update_policy ON tags;
DROP POLICY tags_delete_policy ON tags;

-- Users can see their own tags
CREATE POLICY tags_select_policy ON tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY tags_insert_policy ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id AND (
    subject_id IS NULL OR
    EXISTS (
      SELECT 1 FROM subjects
      JOIN schools ON schools.id = subjects.school_id
      WHERE subjects.id = tags.subject_id
      AND schools.user_id = auth.uid()
    )
  ));

CREATE POLICY tags_update_policy ON tags
  FOR UPDATE USING (auth.uid() = user_id AND (
    subject_id IS NULL OR
    EXISTS (
      SELECT 1 FROM subjects
      JOIN schools ON schools.id = subjects.school_id
      WHERE subjects.id = tags.subject_id
      AND schools.user_id = auth.uid()
    )
  ));

CREATE POLICY tags_delete_policy ON tags
  FOR DELETE USING (auth.uid() = user_id);