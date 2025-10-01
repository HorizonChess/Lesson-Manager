import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkMatzpeGroups() {
  // Get מצפה school
  const { data: school } = await supabase
    .from('schools')
    .select('id, name')
    .eq('name', 'מצפה')
    .single()

  if (!school) {
    console.log('❌ School "מצפה" not found')
    return
  }

  console.log(`\n🏫 School: ${school.name} (${school.id})`)

  // Get all groups for this school
  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      id,
      name,
      subject_id,
      subjects (
        id,
        name
      )
    `)
    .eq('school_id', school.id)
    .order('name')

  if (error) {
    console.error('❌ Error fetching groups:', error)
    return
  }

  if (!groups || groups.length === 0) {
    console.log('✅ No groups found for this school')
    return
  }

  console.log(`\n📊 Found ${groups.length} groups:\n`)

  // Group by subject
  const groupsBySubject = new Map<string, any[]>()

  for (const group of groups) {
    const subject = (group as any).subjects
    const subjectName = subject?.name || 'Unknown'

    if (!groupsBySubject.has(subjectName)) {
      groupsBySubject.set(subjectName, [])
    }
    groupsBySubject.get(subjectName)!.push(group)
  }

  for (const [subjectName, subjectGroups] of groupsBySubject) {
    console.log(`📚 Subject: ${subjectName}`)
    for (const group of subjectGroups) {
      console.log(`   - ${group.name} (${group.id})`)
    }
    console.log()
  }

  // Get school_subjects for this school
  console.log('\n🔗 School-Subject Assignments:')
  const { data: assignments } = await supabase
    .from('school_subjects')
    .select(`
      id,
      subject_id,
      subjects (
        name
      )
    `)
    .eq('school_id', school.id)

  if (assignments) {
    for (const assn of assignments) {
      const subject = (assn as any).subjects
      console.log(`   - ${subject.name}`)
    }
  }
}

checkMatzpeGroups().catch(console.error)
