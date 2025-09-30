/**
 * Check מצפה School State
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const MATZPE_SCHOOL_ID = '6ad16948-b0eb-4bac-8c80-dd9f1a0f77d6'

async function checkState() {
  console.log('🔍 Checking מצפה school state...\n')

  // Check all subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('name')

  console.log('📚 All Subjects:')
  subjects?.forEach(s => console.log(`  - ${s.name} (ID: ${s.id})`))

  // Check groups for מצפה
  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, subject_id')
    .eq('school_id', MATZPE_SCHOOL_ID)
    .order('name')

  console.log('\n👥 Groups for מצפה:')
  if (groups && groups.length > 0) {
    for (const g of groups) {
      const subject = subjects?.find(s => s.id === g.subject_id)
      console.log(`  - ${g.name} → Subject: ${subject?.name || 'UNKNOWN'} (${g.subject_id})`)
    }
  } else {
    console.log('  ❌ NO GROUPS FOUND!')
  }

  // Check school_subjects for מצפה
  const { data: schoolSubjects } = await supabase
    .from('school_subjects')
    .select('*, subjects(name)')
    .eq('school_id', MATZPE_SCHOOL_ID)

  console.log('\n🔗 School-Subject Assignments for מצפה:')
  schoolSubjects?.forEach((ss: any) => console.log(`  - ${ss.subjects.name} (${ss.subject_id})`))

  // Check lessons for מצפה groups
  if (groups && groups.length > 0) {
    const groupIds = groups.map(g => g.id)
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, group_id')
      .in('group_id', groupIds)

    console.log(`\n📅 Lessons for מצפה groups: ${lessons?.length || 0}`)
  }
}

checkState().catch(console.error)