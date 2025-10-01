import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

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
  console.log('🔧 Applying migration: 005_simplify_subjects.sql\n')

  // Read the SQL file
  const sqlPath = path.join(process.cwd(), 'supabase/migrations/005_simplify_subjects.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  console.log('⚠️  WARNING: This migration will:')
  console.log('   1. Add user_id to subjects table')
  console.log('   2. Drop school_subjects table')
  console.log('   3. Update RLS policies')
  console.log('\n📋 SQL to execute:')
  console.log('---')
  console.log(sql)
  console.log('---\n')

  console.log('❌ Cannot execute multi-statement SQL via Supabase JS client.')
  console.log('\n✅ Please copy the SQL above and run it in Supabase SQL Editor:')
  console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql\n`)
  console.log('After running the SQL, press Enter to verify the migration...')

  // Wait for user to press Enter
  await new Promise(resolve => {
    process.stdin.once('data', resolve)
  })

  // Verify migration
  console.log('\n🔍 Verifying migration...\n')

  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name, user_id')
    .limit(5)

  if (subjectsError) {
    console.error('❌ Error querying subjects:', subjectsError)
    process.exit(1)
  }

  console.log('✅ Subjects table structure:')
  console.log(subjects)

  const allHaveUserId = subjects?.every(s => s.user_id !== null)
  console.log(`\n${allHaveUserId ? '✅' : '❌'} All subjects have user_id`)

  // Check if school_subjects table exists
  const { error: schoolSubjectsError } = await supabase
    .from('school_subjects' as any)
    .select('id')
    .limit(1)

  if (schoolSubjectsError && schoolSubjectsError.message.includes('does not exist')) {
    console.log('✅ school_subjects table dropped successfully')
  } else if (schoolSubjectsError) {
    console.error('❌ Unexpected error:', schoolSubjectsError)
  } else {
    console.log('❌ school_subjects table still exists!')
  }

  console.log('\n✅ Migration verification complete!')
}

applyMigration().catch(console.error)
