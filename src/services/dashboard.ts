import { supabase } from '../lib/supabase'

export interface DashboardCounts {
  schools: number
  subjects: number
  groups: number
  lessons: number
  lessonRecords: number
  completedTasks: number
  openTasks: number
}

export async function fetchDashboardCounts(userId: string): Promise<DashboardCounts> {
  const [schools, subjects, groups, lessons, lessonRecords, tasks] = await Promise.all([
    supabase.from('schools').select('id', { count: 'exact', head: true }),
    supabase.from('subjects').select('id', { count: 'exact', head: true }),
    supabase.from('groups').select('id', { count: 'exact', head: true }),
    supabase.from('lessons').select('id', { count: 'exact', head: true }),
    supabase.from('lesson_records').select('id', { count: 'exact', head: true }),
    supabase.from('tasks').select('id, is_completed').eq('user_id', userId)
  ])

  const completedTasks = tasks.data?.filter(task => task.is_completed).length ?? 0
  const openTasks = tasks.data?.length ? tasks.data.length - completedTasks : 0

  return {
    schools: schools.count ?? 0,
    subjects: subjects.count ?? 0,
    groups: groups.count ?? 0,
    lessons: lessons.count ?? 0,
    lessonRecords: lessonRecords.count ?? 0,
    completedTasks,
    openTasks
  }
}

export interface LessonSummary {
  id: string
  start_time: string
}

export async function fetchLessonsBetween(start: string, end: string): Promise<LessonSummary[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, start_time')
    .gte('start_time', start)
    .lte('start_time', end)

  if (error) {
    throw error
  }

  return data ?? []
}

export interface LessonWithGroup {
  id: string
  start_time: string
  end_time: string
  is_cancelled: boolean
  group_name: string
  school_name: string
  subject_name: string
}

export async function fetchLessonsForDay(start: string, end: string): Promise<LessonWithGroup[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select(`
      id,
      start_time,
      end_time,
      is_cancelled,
      groups (
        name,
        schools (name),
        subjects (name)
      )
    `)
    .gte('start_time', start)
    .lt('start_time', end)
    .order('start_time')

  if (error) {
    throw error
  }

  return (data ?? []).map(lesson => ({
    id: lesson.id,
    start_time: lesson.start_time,
    end_time: lesson.end_time,
    is_cancelled: lesson.is_cancelled,
    group_name: lesson.groups?.name ?? 'Unknown Group',
    school_name: lesson.groups?.schools?.name ?? 'Unknown School',
    subject_name: lesson.groups?.subjects?.name ?? 'Unknown Subject'
  }))
}

export async function fetchOpenTasks(limit = 3) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_completed', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data ?? []
}

export async function fetchRecentMaterials(limit = 3) {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data ?? []
}
