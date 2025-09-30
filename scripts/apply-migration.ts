/**
 * Migration Application Script
 * Applies SQL migration files to Supabase database
 *
 * Usage: npx tsx scripts/apply-migration.ts <migration-file>
 * Example: npx tsx scripts/apply-migration.ts ./supabase/migrations/003_global_subjects.sql
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { config } from 'dotenv'

// Load environment variables from .env
config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('❌ Usage: npx tsx scripts/apply-migration.ts <migration-file>')
  console.error('Example: npx tsx scripts/apply-migration.ts ./supabase/migrations/003_global_subjects.sql')
  process.exit(1)
}

if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Migration file not found: ${migrationFile}`)
  process.exit(1)
}

async function applyMigration() {
  console.log(`📦 Applying migration: ${migrationFile}\n`)

  const sql = fs.readFileSync(migrationFile, 'utf-8')

  try {
    // Execute the SQL migration
    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.error('❌ Migration failed:', error.message)
      console.error('Details:', error)
      process.exit(1)
    }

    console.log('✅ Migration applied successfully!')

  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
}

applyMigration().catch(console.error)