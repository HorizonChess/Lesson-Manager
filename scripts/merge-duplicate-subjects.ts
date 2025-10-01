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

interface Subject {
  id: string
  name: string
  created_at: string
}

async function mergeDuplicateSubjects() {
  console.log('🔍 Finding duplicate subjects...\n')

  // Fetch all subjects
  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('id, name, created_at')
    .order('name', { ascending: true })

  if (error) {
    console.error('❌ Error fetching subjects:', error)
    process.exit(1)
  }

  if (!subjects || subjects.length === 0) {
    console.log('✅ No subjects found')
    return
  }

  // Group subjects by normalized name (lowercase, trimmed)
  const subjectGroups = new Map<string, Subject[]>()

  for (const subject of subjects) {
    const normalizedName = subject.name.toLowerCase().trim()
    if (!subjectGroups.has(normalizedName)) {
      subjectGroups.set(normalizedName, [])
    }
    subjectGroups.get(normalizedName)!.push(subject)
  }

  // Find duplicates
  const duplicates: Array<{ name: string; subjects: Subject[] }> = []

  for (const [normalizedName, subjectList] of subjectGroups.entries()) {
    if (subjectList.length > 1) {
      duplicates.push({ name: normalizedName, subjects: subjectList })
    }
  }

  if (duplicates.length === 0) {
    console.log('✅ No duplicate subjects found!')
    return
  }

  console.log(`Found ${duplicates.length} duplicate subject name(s):\n`)

  for (const dup of duplicates) {
    console.log(`📋 "${dup.subjects[0].name}" has ${dup.subjects.length} duplicates:`)
    for (const subject of dup.subjects) {
      console.log(`   - ID: ${subject.id}, Created: ${subject.created_at}`)
    }
    console.log()
  }

  // Merge each duplicate set
  for (const dup of duplicates) {
    // Keep the oldest subject (earliest created_at)
    const sortedSubjects = [...dup.subjects].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    const keepSubject = sortedSubjects[0]
    const deleteSubjects = sortedSubjects.slice(1)

    console.log(`\n🔄 Merging "${keepSubject.name}"...`)
    console.log(`   Keeping: ${keepSubject.id} (${keepSubject.created_at})`)

    for (const deleteSubject of deleteSubjects) {
      console.log(`   Merging: ${deleteSubject.id} → ${keepSubject.id}`)

      // 1. Update all groups using this subject
      const { data: groupsData, error: groupsCheckError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('subject_id', deleteSubject.id)

      if (groupsCheckError) {
        console.error(`   ❌ Error checking groups: ${groupsCheckError.message}`)
        continue
      }

      if (groupsData && groupsData.length > 0) {
        console.log(`   → Updating ${groupsData.length} group(s)...`)

        const { error: updateGroupsError } = await supabase
          .from('groups')
          .update({ subject_id: keepSubject.id })
          .eq('subject_id', deleteSubject.id)

        if (updateGroupsError) {
          console.error(`   ❌ Error updating groups: ${updateGroupsError.message}`)
          continue
        }

        console.log(`   ✅ Updated ${groupsData.length} group(s)`)
      }

      // 2. Update school_subjects entries
      const { data: schoolSubjectsData, error: schoolSubjectsCheckError } = await supabase
        .from('school_subjects')
        .select('school_id')
        .eq('subject_id', deleteSubject.id)

      if (schoolSubjectsCheckError) {
        console.error(`   ❌ Error checking school_subjects: ${schoolSubjectsCheckError.message}`)
        continue
      }

      if (schoolSubjectsData && schoolSubjectsData.length > 0) {
        console.log(`   → Updating ${schoolSubjectsData.length} school assignment(s)...`)

        // For each school, check if they already have the keep subject
        for (const { school_id } of schoolSubjectsData) {
          // Check if association already exists
          const { data: existing } = await supabase
            .from('school_subjects')
            .select('id')
            .eq('school_id', school_id)
            .eq('subject_id', keepSubject.id)
            .maybeSingle()

          if (!existing) {
            // Create new association with keep subject
            const { error: insertError } = await supabase
              .from('school_subjects')
              .insert({ school_id, subject_id: keepSubject.id })

            if (insertError) {
              console.error(`   ❌ Error creating school_subjects: ${insertError.message}`)
            }
          }

          // Delete old association
          const { error: deleteAssocError } = await supabase
            .from('school_subjects')
            .delete()
            .eq('school_id', school_id)
            .eq('subject_id', deleteSubject.id)

          if (deleteAssocError) {
            console.error(`   ❌ Error deleting school_subjects: ${deleteAssocError.message}`)
          }
        }

        console.log(`   ✅ Updated ${schoolSubjectsData.length} school assignment(s)`)
      }

      // 3. Delete the duplicate subject
      const { error: deleteError } = await supabase
        .from('subjects')
        .delete()
        .eq('id', deleteSubject.id)

      if (deleteError) {
        console.error(`   ❌ Error deleting subject: ${deleteError.message}`)
      } else {
        console.log(`   ✅ Deleted duplicate subject ${deleteSubject.id}`)
      }
    }

    console.log(`✅ Merged "${keepSubject.name}" successfully!`)
  }

  console.log('\n✅ All duplicate subjects merged!')
}

mergeDuplicateSubjects().catch(console.error)
