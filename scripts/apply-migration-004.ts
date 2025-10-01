import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('📝 Applying migration: 004_fix_subject_delete_policy.sql\n')

  const sql = `
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
`

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }) as any

  if (error) {
    // Try direct SQL execution if RPC doesn't exist
    const statements = sql.split(';').filter(s => s.trim())

    for (const statement of statements) {
      if (!statement.trim()) continue

      console.log('Executing:', statement.substring(0, 50) + '...')

      // Supabase client doesn't support raw SQL directly
      // We need to use the SQL editor in Supabase dashboard
      console.log('\n⚠️  Cannot execute migration via script.')
      console.log('Please run this SQL manually in Supabase SQL Editor:\n')
      console.log(sql)
      process.exit(1)
    }
  }

  console.log('✅ Migration applied successfully!')
}

applyMigration().catch(console.error)
