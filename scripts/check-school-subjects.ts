import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.VITE_SUPABASE_ANON_KEY as string
)

const { data, error } = await supabase
  .from('school_subjects')
  .select('id')
  .limit(1)

if (error) {
  console.log('❌ school_subjects table does not exist')
  console.log('Run migration 006 to create it')
} else {
  console.log('✅ school_subjects table exists')
}
