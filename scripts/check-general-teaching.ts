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

async function checkGeneralTeaching() {
  console.log('🔍 Checking "General Teaching" subject...\n')

  // Get all subjects with "general" in the name
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, created_at')
    .ilike('name', '%general%')
    .order('name')

  if (!subjects || subjects.length === 0) {
    console.log('✅ No subjects with "general" in name')
    return
  }

  console.log(`📚 Found ${subjects.length} subject(s):\n`)

  for (const subject of subjects) {
    console.log(`\n📖 Subject: "${subject.name}"`)
    console.log(`   ID: ${subject.id}`)
    console.log(`   Created: ${subject.created_at}`)

    // Check groups using this subject
    const { data: groups } = await supabase
      .from('groups')
      .select('id, name, school_id, schools(name)')
      .eq('subject_id', subject.id)

    if (groups && groups.length > 0) {
      console.log(`   ⚠️  ${groups.length} group(s) using this subject:`)
      for (const group of groups) {
        const school = (group as any).schools
        console.log(`      - ${group.name} (${school?.name || 'Unknown school'})`)
      }
    } else {
      console.log(`   ✅ No groups using this subject`)
    }

    // Check school assignments
    const { data: assignments } = await supabase
      .from('school_subjects')
      .select('school_id, schools(name)')
      .eq('subject_id', subject.id)

    if (assignments && assignments.length > 0) {
      console.log(`   🏫 ${assignments.length} school(s) assigned:`)
      for (const assn of assignments) {
        const school = (assn as any).schools
        console.log(`      - ${school?.name || 'Unknown'}`)
      }
    } else {
      console.log(`   ✅ No schools assigned`)
    }
  }
}

checkGeneralTeaching().catch(console.error)
