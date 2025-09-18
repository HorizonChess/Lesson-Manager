import { supabase } from '../lib/supabase'
import type { Subject } from '../types/database'

export interface CreateSubjectParams {
  name: string
  schoolId: string
}

export async function createSubject(params: CreateSubjectParams): Promise<Subject> {
  const { data, error } = await supabase
    .from('subjects')
    .insert([{ name: params.name, school_id: params.schoolId }])
    .select()
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create subject')
  }

  return data as Subject
}

