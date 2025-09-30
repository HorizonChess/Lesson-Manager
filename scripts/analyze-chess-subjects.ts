/**
 * Analyze Chess Subjects
 * See which schools/groups use which Chess subject
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

const CHESS_ID_1 = '04034b9e-e2fc-4a76-bb50-239f3c638d95'
const CHESS_ID_2 = '55316d2c-9abc-4a61-a809-539b59654f95'

async function analyzeChess() {
  console.log('🔍 Analyzing Chess (שחמט) subjects...\n')

  for (const id of [CHESS_ID_1, CHESS_ID_2]) {
    console.log(`\n📋 Chess Subject: ${id}`)
    console.log('─'.repeat(50))

    // Check school assignments
    const { data: schoolAssignments } = await supabase
      .from('school_subjects')
      .select('school_id, schools(name)')
      .eq('subject_id', id)

    console.log(`Schools assigned: ${schoolAssignments?.length || 0}`)
    schoolAssignments?.forEach((sa: any) => {
      console.log(`  - ${sa.schools.name}`)
    })

    // Check groups
    const { data: groups } = await supabase
      .from('groups')
      .select('id, name, school_id, schools(name)')
      .eq('subject_id', id)

    console.log(`Groups using it: ${groups?.length || 0}`)
    groups?.forEach((g: any) => {
      console.log(`  - ${g.name} in ${g.schools.name}`)
    })

    // Check lessons
    if (groups && groups.length > 0) {
      const groupIds = groups.map(g => g.id)
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .in('group_id', groupIds)

      console.log(`Lessons: ${lessons?.length || 0}`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('RECOMMENDATION:')
  console.log('We should keep ONE Chess subject and delete the other.')
  console.log('The one with groups should be kept.')
}

analyzeChess().catch(console.error)