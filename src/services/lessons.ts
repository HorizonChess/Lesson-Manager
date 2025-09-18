import { supabase } from '../lib/supabase'
import type { Lesson } from '../types/database'

export interface LessonInsert {
  groupId: string
  startTime: string
  endTime: string
  isCancelled?: boolean
}

export async function hasAnyLessons(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('lessons')
      .select('id')
      .limit(1)

    return Array.isArray(data) && data.length > 0
  } catch (error) {
    console.error('Error checking existing lessons:', error)
    return false
  }
}

export async function insertLessons(lessons: LessonInsert[]): Promise<void> {
  if (lessons.length === 0) {
    return
  }

  const payload = lessons.map(lesson => ({
    group_id: lesson.groupId,
    start_time: lesson.startTime,
    end_time: lesson.endTime,
    is_cancelled: lesson.isCancelled ?? false
  }))

  const { error } = await supabase
    .from('lessons')
    .insert(payload)

  if (error) {
    throw error
  }
}

export async function updateLessonCancellation(lessonId: string, isCancelled: boolean) {
  const { data, error } = await supabase
    .from('lessons')
    .update({ is_cancelled: isCancelled })
    .eq('id', lessonId)
    .select()
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to update lesson')
  }

  return data as Lesson
}

export async function deleteLessonById(lessonId: string): Promise<void> {
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)

  if (error) {
    throw error
  }
}

