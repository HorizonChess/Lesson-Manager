-- Fix subject delete policy to allow deleting unassigned subjects
-- The previous policy blocked deletion of subjects with NO school assignments

DROP POLICY subjects_delete_policy ON subjects;

CREATE POLICY subjects_delete_policy ON subjects
  FOR DELETE USING (
    -- Users can delete subjects if:
    -- 1. The subject is assigned to at least one of their schools, OR
    -- 2. The subject is not assigned to ANY schools (orphaned)
    (
      EXISTS (
        SELECT 1 FROM school_subjects ss
        INNER JOIN schools s ON s.id = ss.school_id
        WHERE ss.subject_id = subjects.id
        AND s.user_id = auth.uid()
      )
      OR NOT EXISTS (
        SELECT 1 FROM school_subjects ss
        WHERE ss.subject_id = subjects.id
      )
    )
    -- AND ensure no other users are using this subject
    AND NOT EXISTS (
      SELECT 1 FROM school_subjects ss
      INNER JOIN schools s ON s.id = ss.school_id
      WHERE ss.subject_id = subjects.id
      AND s.user_id != auth.uid()
    )
  );
