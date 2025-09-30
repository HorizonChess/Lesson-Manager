/**
 * Fix מצפה School Assignments
 * Re-assign subjects to school based on existing groups
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

async function fixAssignments() {
  console.log('🔧 Fixing מצפה school subject assignments...\n')

  // Get all groups for מצפה and their subjects
  const { data: groups } = await supabase
    .from('groups')
    .select('subject_id')
    .eq('school_id', MATZPE_SCHOOL_ID)

  if (!groups || groups.length === 0) {
    console.log('❌ No groups found!')
    return
  }

  // Get unique subject IDs
  const subjectIds = [...new Set(groups.map(g => g.subject_id))]

  console.log(`Found ${subjectIds.length} unique subjects used by groups\n`)

  for (const subjectId of subjectIds) {
    // Get subject name
    const { data: subject } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', subjectId)
      .single()

    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('school_subjects')
      .select('id')
      .eq('school_id', MATZPE_SCHOOL_ID)
      .eq('subject_id', subjectId)
      .single()

    if (existing) {
      console.log(`⏭️  "${subject?.name}" already assigned`)
      continue
    }

    // Create assignment
    const { error } = await supabase
      .from('school_subjects')
      .insert({
        school_id: MATZPE_SCHOOL_ID,
        subject_id: subjectId
      })

    if (error) {
      console.error(`❌ Error assigning "${subject?.name}":`, error.message)
    } else {
      console.log(`✅ Assigned "${subject?.name}" to מצפה`)
    }
  }

  console.log('\n✅ Assignments fixed!')
}

fixAssignments().catch(console.error)