import { supabase } from '../lib/supabase'
import type { Group, Lesson, LessonRecord, Material } from '../types/database'

export interface GroupWithDetails extends Group {
  school?: { name: string } | null
  subject?: { name: string } | null
}

export interface LessonWithGroup extends Lesson {
  group?: {
    name?: string | null
    school?: { name?: string | null } | null
    subject?: { name?: string | null } | null
  } | null
}

export type NormalizedLesson = LessonWithGroup & {
  group: {
    name: string
    school: { name: string }
    subject: { name: string }
  }
}

export async function fetchGroupsWithDetails(): Promise<GroupWithDetails[]> {
  const { data, error } = await supabase
    .from('groups')
    .select(`* , school:schools(name), subject:subjects(name)`)
    .order('name')

  if (error) {
    throw error
  }

  return (data ?? []) as GroupWithDetails[]
}

export async function fetchLessonsWithGroups(): Promise<LessonWithGroup[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select(`* , group:groups(name, school:schools(name), subject:subjects(name))`)
    .order('start_time', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as LessonWithGroup[]
}

export async function deleteLessonsByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return

  const { error } = await supabase
    .from('lessons')
    .delete()
    .in('id', ids)

  if (error) {
    throw error
  }
}

export async function fetchLessonRecordsMap(): Promise<Record<string, LessonRecord>> {
  const { data, error } = await supabase
    .from('lesson_records')
    .select('*')

  if (error) {
    throw error
  }

  const byLesson = (data ?? []).reduce<Record<string, LessonRecord>>((acc, record) => {
    acc[record.lesson_id] = record as LessonRecord
    return acc
  }, {})

  return byLesson
}

export async function fetchMaterialsList(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('title')

  if (error) {
    throw error
  }

  return (data ?? []) as Material[]
}

export async function fetchLessonMaterialsMap(): Promise<Record<string, Material[]>> {
  const { data, error } = await supabase
    .from('lesson_materials')
    .select(`lesson_record_id, material:materials(*)`)

  if (error) {
    throw error
  }

  const map = (data ?? []).reduce<Record<string, Material[]>>((acc, item: any) => {
    const recordId = item.lesson_record_id
    if (!acc[recordId]) {
      acc[recordId] = []
    }
    if (item.material) {
      acc[recordId].push(item.material as Material)
    }
    return acc
  }, {})

  return map
}
