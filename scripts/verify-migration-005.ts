import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verify() {
  console.log('🔍 Verifying migration 005...\n')

  // Check subjects have user_id
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name, user_id')

  if (subjectsError) {
    console.error('❌ Error querying subjects:', subjectsError)
    process.exit(1)
  }

  console.log(`✅ Found ${subjects?.length} subjects`)
  const allHaveUserId = subjects?.every(s => s.user_id)
  console.log(`${allHaveUserId ? '✅' : '❌'} All subjects have user_id: ${allHaveUserId}`)

  if (subjects && subjects.length > 0) {
    console.log('\nSample subjects:')
    subjects.slice(0, 3).forEach(s => {
      console.log(`  - ${s.name} (user_id: ${s.user_id})`)
    })
  }

  // Check if school_subjects is gone
  const { error: schoolSubjectsError } = await supabase
    .from('school_subjects' as any)
    .select('id')
    .limit(1)

  if (schoolSubjectsError?.message?.includes('does not exist')) {
    console.log('\n✅ school_subjects table dropped successfully')
  } else {
    console.log('\n❌ school_subjects table still exists!')
  }

  // Check groups are intact
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('id, name, subject_id')

  if (groupsError) {
    console.error('❌ Error querying groups:', groupsError)
  } else {
    console.log(`\n✅ Found ${groups?.length} groups`)
    const groupsWithNullSubject = groups?.filter(g => !g.subject_id).length || 0
    console.log(`${groupsWithNullSubject === 0 ? '✅' : '❌'} Groups with null subject_id: ${groupsWithNullSubject}`)
  }

  // Check lessons are intact
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id')

  if (lessonsError) {
    console.error('❌ Error querying lessons:', lessonsError)
  } else {
    console.log(`\n✅ Found ${lessons?.length} lessons (unchanged)`)
  }

  console.log('\n✅ Migration verification complete!')
}

verify().catch(console.error)
