import { supabase } from '../lib/supabase'
import type { Task, Group, Lesson } from '../types/database'

export interface GroupWithMeta extends Group {
  school?: { name: string | null } | null
  subject?: { name: string | null } | null
}

export interface LessonWithMeta extends Lesson {
  group?: {
    name: string | null
    school?: { name: string | null } | null
    subject?: { name: string | null } | null
  } | null
}

export interface TaskWithLinks extends Task {
  group?: {
    name: string | null
    school?: { name: string | null } | null
    subject?: { name: string | null } | null
  } | null
  lesson?: {
    start_time: string
    end_time?: string | null
    group?: {
      name: string | null
      school?: { name: string | null } | null
      subject?: { name: string | null } | null
    } | null
  } | null
}

export async function fetchTasks(): Promise<TaskWithLinks[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`*, group:groups(name, school:schools(name), subject:subjects(name)), lesson:lessons(start_time, end_time, group:groups(name, school:schools(name), subject:subjects(name)))`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as TaskWithLinks[]
}

export async function fetchGroups(): Promise<GroupWithMeta[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*, school:schools(name), subject:subjects(name)')
    .order('name')

  if (error) throw error
  return (data ?? []) as GroupWithMeta[]
}

export async function fetchLessons(): Promise<LessonWithMeta[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*, group:groups(name, school:schools(name), subject:subjects(name))')
    .order('start_time', { ascending: false })

  if (error) throw error
  return (data ?? []) as LessonWithMeta[]
}

export interface TaskPayload {
  userId: string
  title: string
  description?: string | null
  groupId?: string | null
  lessonId?: string | null
}

export async function createTask(payload: TaskPayload): Promise<TaskWithLinks> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: payload.userId,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      group_id: payload.groupId || null,
      lesson_id: payload.lessonId || null,
      is_completed: false
    })
    .select(`* , group:groups(name), lesson:lessons(start_time, end_time)`)
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create task')
  }

  return data as TaskWithLinks
}

export interface TaskUpdatePayload {
  title?: string
  description?: string | null
  groupId?: string | null
  lessonId?: string | null
  isCompleted?: boolean
}

export async function updateTask(taskId: string, payload: TaskUpdatePayload): Promise<TaskWithLinks> {
  const patch: Record<string, any> = {}
  if (payload.title !== undefined) patch.title = payload.title.trim()
  if (payload.description !== undefined) patch.description = payload.description?.trim() || null
  if (payload.groupId !== undefined) patch.group_id = payload.groupId || null
  if (payload.lessonId !== undefined) patch.lesson_id = payload.lessonId || null
  if (payload.isCompleted !== undefined) patch.is_completed = payload.isCompleted

  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', taskId)
    .select(`* , group:groups(name), lesson:lessons(start_time, end_time)`)
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to update task')
  }

  return data as TaskWithLinks
}

export async function deleteTaskById(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) throw error
}
