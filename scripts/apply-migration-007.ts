import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import 'dotenv/config'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.VITE_SUPABASE_ANON_KEY as string
)

const migrationPath = join(process.cwd(), 'supabase', 'migrations', '007_wage_tracking.sql')
const sql = readFileSync(migrationPath, 'utf-8')

console.log('🔧 Applying migration: 007_wage_tracking.sql\n')
console.log('⚠️  WARNING: This migration will:')
console.log('   1. Create wage_settings table for default hourly rates')
console.log('   2. Create wage_exceptions table for school/group rate overrides')
console.log('   3. Set up RLS policies and indexes\n')

console.log('📋 SQL to execute:')
console.log('---')
console.log(sql)
console.log('---\n')

console.log('❌ Cannot execute multi-statement SQL via Supabase JS client.\n')
console.log('✅ Please copy the SQL above and run it in Supabase SQL Editor:')
console.log('   https://supabase.com/dashboard/project/rabfrsssjxcjnmzhyscb/sql\n')

// Wait for user to apply the migration
const readline = await import('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

await new Promise<void>((resolve) => {
  rl.question('After running the SQL, press Enter to verify the migration...', () => {
    rl.close()
    resolve()
  })
})

// Verify the migration
console.log('\n🔍 Verifying migration...\n')

const { data: wageSettings, error: wageSettingsError } = await supabase
  .from('wage_settings')
  .select('id')
  .limit(1)

const { data: wageExceptions, error: wageExceptionsError } = await supabase
  .from('wage_exceptions')
  .select('id')
  .limit(1)

if (!wageSettingsError && !wageExceptionsError) {
  console.log('✅ Migration successful!')
  console.log('   - wage_settings table exists')
  console.log('   - wage_exceptions table exists')
} else {
  console.log('❌ Migration verification failed:')
  if (wageSettingsError) console.log('   - wage_settings:', wageSettingsError.message)
  if (wageExceptionsError) console.log('   - wage_exceptions:', wageExceptionsError.message)
}
