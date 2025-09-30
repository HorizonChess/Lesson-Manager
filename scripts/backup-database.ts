/**
 * Database Backup Script
 * Exports all tables to JSON files in ./backups directory
 *
 * Usage: npx tsx scripts/backup-database.ts
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'

// Load environment variables from .env
config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
// Use service role key to bypass RLS for backup
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  console.error('💡 Add SUPABASE_SERVICE_ROLE_KEY to your .env file to backup with RLS bypass')
  console.error('   Find it in: Supabase Dashboard → Settings → API → service_role key')
  process.exit(1)
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  WARNING: Using anon key - RLS policies will limit backup to current user only')
  console.warn('   For complete backup, add SUPABASE_SERVICE_ROLE_KEY to .env\n')
}

const supabase = createClient(supabaseUrl, supabaseKey)

const TABLES = [
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

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const backupDir = path.join(process.cwd(), 'backups', `backup-${timestamp}`)

  // Create backup directory
  fs.mkdirSync(backupDir, { recursive: true })

  console.log(`📦 Creating backup in: ${backupDir}\n`)

  const manifest: Record<string, number> = {}

  for (const table of TABLES) {
    try {
      const { data, error } = await supabase.from(table).select('*')

      if (error) {
        console.error(`❌ Error backing up ${table}:`, error.message)
        continue
      }

      const filePath = path.join(backupDir, `${table}.json`)
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))

      manifest[table] = data?.length || 0
      console.log(`✅ ${table}: ${data?.length || 0} rows`)

    } catch (err) {
      console.error(`❌ Failed to backup ${table}:`, err)
    }
  }

  // Write manifest
  fs.writeFileSync(
    path.join(backupDir, 'manifest.json'),
    JSON.stringify({ timestamp, tables: manifest }, null, 2)
  )

  console.log(`\n✅ Backup complete!`)
  console.log(`📁 Location: ${backupDir}`)
  console.log(`\n💡 To restore, run: npx tsx scripts/restore-database.ts ${backupDir}`)
}

backup().catch(console.error)