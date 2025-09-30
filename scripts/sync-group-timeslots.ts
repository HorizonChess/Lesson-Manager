/**
 * Sync Group Timeslots Script
 * Extracts timeslot patterns from lessons and updates groups.timeslots
 *
 * Usage: npx tsx scripts/sync-group-timeslots.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import moment from 'moment'

// Load environment variables from .env
config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface Lesson {
  id: string
  group_id: string
  start_time: string
  end_time: string
}

interface Timeslot {
  day: string
  startTime: string
  endTime: string
}

async function syncGroupTimeslots() {
  console.log('🔄 Syncing group timeslots from lessons...\n')

  // Fetch all lessons
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, group_id, start_time, end_time')
    .order('start_time')

  if (lessonsError) {
    console.error('❌ Error fetching lessons:', lessonsError)
    process.exit(1)
  }

  console.log(`📚 Found ${lessons.length} lessons`)

  // Group lessons by group_id
  const lessonsByGroup: Record<string, Lesson[]> = {}
  for (const lesson of lessons) {
    if (!lessonsByGroup[lesson.group_id]) {
      lessonsByGroup[lesson.group_id] = []
    }
    lessonsByGroup[lesson.group_id].push(lesson)
  }

  console.log(`👥 Found ${Object.keys(lessonsByGroup).length} groups with lessons\n`)

  let updatedCount = 0

  for (const [groupId, groupLessons] of Object.entries(lessonsByGroup)) {
    if (groupLessons.length === 0) continue

    // Extract unique timeslot patterns from lessons
    const timeslotMap = new Map<string, Timeslot>()

    for (const lesson of groupLessons) {
      const start = moment(lesson.start_time)
      const end = moment(lesson.end_time)

      const day = start.format('dddd') // Monday, Tuesday, etc.
      const startTime = start.format('HH:mm')
      const endTime = end.format('HH:mm')

      const key = `${day}-${startTime}-${endTime}`

      if (!timeslotMap.has(key)) {
        timeslotMap.set(key, {
          day,
          startTime,
          endTime
        })
      }
    }

    const timeslots = Array.from(timeslotMap.values())

    // Update group with timeslots
    const { error: updateError } = await supabase
      .from('groups')
      .update({ timeslots })
      .eq('id', groupId)

    if (updateError) {
      console.error(`❌ Error updating group ${groupId}:`, updateError.message)
    } else {
      updatedCount++

      // Fetch group name for better logging
      const { data: group } = await supabase
        .from('groups')
        .select('name')
        .eq('id', groupId)
        .single()

      console.log(`✅ Updated "${group?.name || groupId}": ${timeslots.length} timeslot(s)`)
      timeslots.forEach(ts => {
        console.log(`   - ${ts.day} ${ts.startTime} - ${ts.endTime}`)
      })
    }
  }

  console.log(`\n✅ Sync complete! Updated ${updatedCount} groups`)
}

syncGroupTimeslots().catch(console.error)