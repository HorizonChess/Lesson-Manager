/**
 * Database Restore Script
 * Restores data from JSON backup files
 *
 * Usage: npx tsx scripts/restore-database.ts <backup-directory>
 * Example: npx tsx scripts/restore-database.ts ./backups/backup-2025-09-30T12-00-00
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'

// Load environment variables from .env
config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
// Use service role key to bypass RLS for restore
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  console.error('💡 Add SUPABASE_SERVICE_ROLE_KEY to your .env file to restore with RLS bypass')
  console.error('   Find it in: Supabase Dashboard → Settings → API → service_role key')
  process.exit(1)
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  WARNING: Using anon key - RLS policies may prevent restore')
  console.warn('   For complete restore, add SUPABASE_SERVICE_ROLE_KEY to .env\n')
}

const supabase = createClient(supabaseUrl, supabaseKey)

const backupDir = process.argv[2]

if (!backupDir) {
  console.error('❌ Usage: npx tsx scripts/restore-database.ts <backup-directory>')
  console.error('Example: npx tsx scripts/restore-database.ts ./backups/backup-2025-09-30T12-00-00')
  process.exit(1)
}

if (!fs.existsSync(backupDir)) {
  console.error(`❌ Backup directory not found: ${backupDir}`)
  process.exit(1)
}

// Restore order matters due to foreign keys
const RESTORE_ORDER = [
  'schools',
  'subjects',
  'groups',
  'roster_items',
  'lessons',
  'lesson_records',
  'attendance',
  'materials',
  'lesson_materials',
  'tags',
  'material_tags',
  'tasks'
]

async function restore() {
  console.log(`📦 Restoring from: ${backupDir}\n`)

  // Load manifest
  const manifestPath = path.join(backupDir, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ manifest.json not found in backup directory')
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  console.log(`📅 Backup created: ${manifest.timestamp}\n`)

  for (const table of RESTORE_ORDER) {
    const filePath = path.join(backupDir, `${table}.json`)

    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Skipping ${table} (no backup file)`)
      continue
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

      if (!data || data.length === 0) {
        console.log(`⏭️  Skipping ${table} (empty)`)
        continue
      }

      const { error } = await supabase.from(table).insert(data)

      if (error) {
        console.error(`❌ Error restoring ${table}:`, error.message)
        continue
      }

      console.log(`✅ ${table}: ${data.length} rows restored`)

    } catch (err) {
      console.error(`❌ Failed to restore ${table}:`, err)
    }
  }

  console.log(`\n✅ Restore complete!`)
}

restore().catch(console.error)