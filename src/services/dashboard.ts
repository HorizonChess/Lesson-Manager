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
    supabase.from('schools').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('groups').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('lesson_records').select('id', { count: 'exact', head: true }).eq('user_id', userId),
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

export async function fetchLessonsBetween(userId: string, start: string, end: string): Promise<LessonSummary[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, start_time')
    .eq('user_id', userId)
    .gte('start_time', start)
    .lte('start_time', end)

  if (error) {
    throw error
  }

  return data ?? []
}

