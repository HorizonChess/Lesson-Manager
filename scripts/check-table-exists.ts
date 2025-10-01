import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTable() {
  // Try to query the table
  const { data, error } = await supabase
    .from('school_subjects' as any)
    .select('*')
    .limit(1)

  console.log('Query result:')
  console.log('- Data:', data)
  console.log('- Error:', error)

  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.log('\n✅ Table does NOT exist (correctly dropped)')
    } else {
      console.log('\n⚠️  Other error:', error.message)
    }
  } else {
    console.log('\n❌ Table EXISTS (not dropped)')
    console.log('Rows:', data?.length)
  }
}

checkTable().catch(console.error)
