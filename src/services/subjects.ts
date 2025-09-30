import { supabase } from '../lib/supabase'
import type { Subject } from '../types/database'

export interface CreateSubjectParams {
  name: string
  schoolId: string
}

export async function createSubject(params: CreateSubjectParams): Promise<Subject> {
  // Step 1: Create the global subject
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .insert([{ name: params.name }])
    .select()
    .single()

  if (subjectError || !subject) {
    throw subjectError ?? new Error('Failed to create subject')
  }

  // Step 2: Assign the subject to the school
  const { error: assignError } = await supabase
    .from('school_subjects')
    .insert({ school_id: params.schoolId, subject_id: subject.id })

  if (assignError) {
    // Rollback: delete the subject if assignment fails
    await supabase.from('subjects').delete().eq('id', subject.id)
    throw assignError
  }

  return subject as Subject
}

