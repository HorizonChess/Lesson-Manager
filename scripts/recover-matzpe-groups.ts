/**
 * Recover Matzpe School Groups
 * Recovers accidentally deleted groups for מצפה school
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'

config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const MATZPE_SCHOOL_ID = '6ad16948-b0eb-4bac-8c80-dd9f1a0f77d6'

async function recoverGroups() {
  console.log('🔄 Recovering מצפה school groups...\n')

  // Read backup data
  const backupPath = path.join(process.cwd(), 'backups', 'backup-2025-09-30T12-45-20')
  const groupsData = JSON.parse(fs.readFileSync(path.join(backupPath, 'groups.json'), 'utf-8'))
  const lessonsData = JSON.parse(fs.readFileSync(path.join(backupPath, 'lessons.json'), 'utf-8'))

  // Filter groups for מצפה school
  const matzpeGroups = groupsData.filter((g: any) => g.school_id === MATZPE_SCHOOL_ID)

  console.log(`Found ${matzpeGroups.length} groups for מצפה school\n`)

  for (const group of matzpeGroups) {
    // Check if group already exists
    const { data: existing } = await supabase
      .from('groups')
      .select('id')
      .eq('id', group.id)
      .single()

    if (existing) {
      console.log(`⏭️  Group "${group.name}" already exists, skipping`)
      continue
    }

    // Insert the group (without school_subject_id field which doesn't exist in new schema)
    const { error } = await supabase
      .from('groups')
      .insert({
        id: group.id,
        school_id: group.school_id,
        subject_id: group.subject_id,
        name: group.name,
        timeslots: group.timeslots || [],
        created_at: group.created_at,
        updated_at: group.updated_at
      })

    if (error) {
      console.error(`❌ Error recovering group "${group.name}":`, error.message)
    } else {
      console.log(`✅ Recovered group "${group.name}" (ID: ${group.id})`)

      // Count lessons for this group
      const lessonCount = lessonsData.filter((l: any) => l.group_id === group.id).length
      console.log(`   Associated lessons: ${lessonCount}`)
    }
  }

  console.log('\n✅ Recovery complete!')
}

recoverGroups().catch(console.error)