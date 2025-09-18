import { supabase } from '../lib/supabase'
import type { LessonRecord } from '../types/database'

const defaultRecord = {
  covered: '',
  planned: '',
  homework: '',
  notes: ''
}

export async function ensureLessonRecord(lessonId: string): Promise<LessonRecord> {
  const { data: existing, error: fetchError } = await supabase
    .from('lesson_records')
    .select('*')
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError
  }

  if (existing) {
    return existing as LessonRecord
  }

  const { data, error } = await supabase
    .from('lesson_records')
    .insert({
      lesson_id: lessonId,
      ...defaultRecord
    })
    .select()
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create lesson record')
  }

  return data as LessonRecord
}

export interface LessonRecordUpdate {
  covered?: string
  planned?: string
  homework?: string
  notes?: string
}

export async function updateLessonRecord(lessonId: string, update: LessonRecordUpdate): Promise<LessonRecord> {
  const { data, error } = await supabase
    .from('lesson_records')
    .update(update)
    .eq('lesson_id', lessonId)
    .select()
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to update lesson record')
  }

  return data as LessonRecord
}
