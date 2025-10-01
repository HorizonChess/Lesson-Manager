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

async function restoreMatzpeGroups() {
  console.log('🔧 Restoring מצפה groups...\n')

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

  // Get שחמט subject
  const { data: chessSubject } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('name', 'שחמט')
    .single()

  if (!chessSubject) {
    console.log('❌ Subject "שחמט" not found')
    return
  }

  // Get General Teaching subject
  const { data: generalSubject } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('name', 'General Teaching')
    .single()

  if (!generalSubject) {
    console.log('❌ Subject "General Teaching" not found')
    return
  }

  console.log(`🏫 School: ${school.name}`)
  console.log(`📚 Moving groups from "${generalSubject.name}" → "${chessSubject.name}"\n`)

  // Update all groups in מצפה that are under General Teaching
  const { data: updatedGroups, error } = await supabase
    .from('groups')
    .update({ subject_id: chessSubject.id })
    .eq('school_id', school.id)
    .eq('subject_id', generalSubject.id)
    .select('id, name')

  if (error) {
    console.error('❌ Error updating groups:', error)
    return
  }

  if (!updatedGroups || updatedGroups.length === 0) {
    console.log('✅ No groups to update')
    return
  }

  console.log(`✅ Updated ${updatedGroups.length} groups:`)
  for (const group of updatedGroups) {
    console.log(`   - ${group.name}`)
  }

  console.log(`\n🎉 Done! All groups are now under "${chessSubject.name}"`)
}

restoreMatzpeGroups().catch(console.error)
