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

async function testDeleteGeneralTeaching() {
  console.log('🗑️  Attempting to delete "General Teaching" subject...\n')

  // Get General Teaching subject
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('name', 'General Teaching')
    .single()

  if (!subject) {
    console.log('✅ "General Teaching" subject not found (already deleted?)')
    return
  }

  console.log(`📖 Found subject: "${subject.name}" (${subject.id})`)

  // Check if any groups use this subject
  const { data: groupsUsingSubject } = await supabase
    .from('groups')
    .select('id, name, school_id')
    .eq('subject_id', subject.id)

  console.log(`📊 Groups using subject: ${groupsUsingSubject?.length || 0}`)

  // Check school_subjects
  const { data: schoolAssignments } = await supabase
    .from('school_subjects')
    .select('id')
    .eq('subject_id', subject.id)

  console.log(`🏫 School assignments: ${schoolAssignments?.length || 0}`)

  // Delete all school_subjects assignments
  console.log('\n🔄 Deleting school_subjects assignments...')
  const { error: deleteAssignmentsError } = await supabase
    .from('school_subjects')
    .delete()
    .eq('subject_id', subject.id)

  if (deleteAssignmentsError) {
    console.error('❌ Error deleting school_subjects:', deleteAssignmentsError)
    return
  } else {
    console.log('✅ Deleted school_subjects assignments')
  }

  // Delete the subject
  console.log('\n🔄 Deleting subject...')
  const { error: deleteSubjectError } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subject.id)

  if (deleteSubjectError) {
    console.error('❌ Error deleting subject:', deleteSubjectError)
    return
  }

  console.log('✅ Subject deleted successfully!')

  // Verify deletion
  const { data: verifySubject } = await supabase
    .from('subjects')
    .select('id')
    .eq('id', subject.id)
    .maybeSingle()

  if (verifySubject) {
    console.log('❌ Subject still exists!')
  } else {
    console.log('✅ Verified: Subject no longer exists')
  }
}

testDeleteGeneralTeaching().catch(console.error)
