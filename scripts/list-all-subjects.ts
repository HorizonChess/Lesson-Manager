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

async function listAllSubjects() {
  console.log('📚 All subjects in database:\n')

  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('id, name, created_at')
    .order('name')

  if (error) {
    console.error('❌ Error fetching subjects:', error)
    return
  }

  if (!subjects || subjects.length === 0) {
    console.log('✅ No subjects found')
    return
  }

  console.log(`Found ${subjects.length} subject(s):\n`)

  for (const subject of subjects) {
    console.log(`📖 ${subject.name}`)
    console.log(`   ID: ${subject.id}`)
    console.log(`   Created: ${subject.created_at}`)

    // Check groups using this subject
    const { data: groups } = await supabase
      .from('groups')
      .select('id')
      .eq('subject_id', subject.id)

    // Check school assignments
    const { data: assignments } = await supabase
      .from('school_subjects')
      .select('id')
      .eq('subject_id', subject.id)

    console.log(`   Groups: ${groups?.length || 0}, Schools: ${assignments?.length || 0}`)
    console.log()
  }
}

listAllSubjects().catch(console.error)
