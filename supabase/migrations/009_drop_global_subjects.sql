-- Migration: Remove unused global_subjects table
-- This table was created accidentally and is not referenced anywhere in the codebase
-- All functionality uses the 'subjects' table with 'school_subjects' junction table

-- Drop the global_subjects table
DROP TABLE IF EXISTS global_subjects CASCADE;
