import { supabase } from '../lib/supabase'
import type { Subject } from '../types/database'

export interface EnsureSchoolSubjectParams {
  name: string
  schoolId: string
  userId: string
}

// Subjects belong to a user and are shared across that user's schools, so
// reuse an existing subject with the same name before creating a new one,
// then link it to the (newly created) school.
export async function ensureSchoolSubject(params: EnsureSchoolSubjectParams): Promise<Subject> {
  const name = params.name.trim()

  const { data: existing, error: findError } = await supabase
    .from('subjects')
    .select('*')
    .ilike('name', name)
    .eq('user_id', params.userId)
    .limit(1)
    .maybeSingle()

  if (findError) {
    throw findError
  }

  let subject = existing as Subject | null

  if (!subject) {
    const { data: created, error: createError } = await supabase
      .from('subjects')
      .insert({ name, user_id: params.userId })
      .select()
      .single()

    if (createError || !created) {
      throw createError ?? new Error('Failed to create subject')
    }

    subject = created as Subject
  }

  const { error: assignError } = await supabase
    .from('school_subjects')
    .insert({ school_id: params.schoolId, subject_id: subject.id })

  if (assignError) {
    throw assignError
  }

  return subject
}
