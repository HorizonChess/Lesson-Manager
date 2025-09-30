-- Check subjects
SELECT id, name FROM subjects ORDER BY name;

-- Check groups for מצפה school
SELECT g.id, g.name, g.school_id, g.subject_id, s.name as subject_name
FROM groups g
LEFT JOIN subjects s ON s.id = g.subject_id
WHERE g.school_id = '6ad16948-b0eb-4bac-8c80-dd9f1a0f77d6'
ORDER BY g.name;

-- Check school_subjects for מצפה
SELECT ss.*, s.name as subject_name
FROM school_subjects ss
JOIN subjects s ON s.id = ss.subject_id
WHERE ss.school_id = '6ad16948-b0eb-4bac-8c80-dd9f1a0f77d6';
