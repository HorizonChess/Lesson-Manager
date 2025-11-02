import { supabase } from '../lib/supabase'
import type { RosterItem, Attendance } from '../types/database'

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

export interface TodayLessonWithAttendance extends LessonWithGroup {
  group_id: string
  lesson_record_id: string | null
  has_attendance: boolean
  attendance_count: number
  roster_count: number
  attendance_percentage: number
  roster: RosterItem[]
  attendance: Record<string, Attendance> // Keyed by roster_item_id
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

  type LessonRow = {
    id: string
    start_time: string
    end_time: string
    is_cancelled: boolean
    groups?: {
      name?: string | null
      schools?: { name?: string | null } | null
      subjects?: { name?: string | null } | null
    } | null
  }

  const rows = (data ?? []) as LessonRow[]

  return rows.map(lesson => ({
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

/**
 * Fetch today's lessons with complete attendance data
 * Includes roster and attendance records for quick access
 */
export async function fetchTodayLessonsWithAttendance(start: string, end: string): Promise<TodayLessonWithAttendance[]> {
  // Fetch lessons with group data
  const { data: lessonsData, error: lessonsError } = await supabase
    .from('lessons')
    .select(`
      id,
      start_time,
      end_time,
      is_cancelled,
      group_id,
      groups (
        name,
        schools (name),
        subjects (name)
      )
    `)
    .gte('start_time', start)
    .lt('start_time', end)
    .order('start_time')

  if (lessonsError) throw lessonsError
  if (!lessonsData || lessonsData.length === 0) return []

  type LessonRow = {
    id: string
    start_time: string
    end_time: string
    is_cancelled: boolean
    group_id: string
    groups?: {
      name?: string | null
      schools?: { name?: string | null } | null
      subjects?: { name?: string | null } | null
    } | null
  }

  const lessons = lessonsData as LessonRow[]
  const lessonIds = lessons.map(l => l.id)
  const groupIds = [...new Set(lessons.map(l => l.group_id))]

  // Fetch lesson records for all lessons
  const { data: lessonRecords } = await supabase
    .from('lesson_records')
    .select('id, lesson_id')
    .in('lesson_id', lessonIds)

  const recordMap = new Map<string, string>()
  lessonRecords?.forEach(record => {
    recordMap.set(record.lesson_id, record.id)
  })

  // Fetch roster for all groups
  const { data: rosterData } = await supabase
    .from('roster_items')
    .select('*')
    .in('group_id', groupIds)
    .order('student_name')

  const rosterByGroup = new Map<string, RosterItem[]>()
  rosterData?.forEach(student => {
    if (!rosterByGroup.has(student.group_id)) {
      rosterByGroup.set(student.group_id, [])
    }
    rosterByGroup.get(student.group_id)!.push(student)
  })

  // Fetch attendance for all lesson records
  const recordIds = Array.from(recordMap.values())
  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('*')
    .in('lesson_record_id', recordIds)

  const attendanceByRecord = new Map<string, Attendance[]>()
  attendanceData?.forEach(att => {
    if (!attendanceByRecord.has(att.lesson_record_id)) {
      attendanceByRecord.set(att.lesson_record_id, [])
    }
    attendanceByRecord.get(att.lesson_record_id)!.push(att)
  })

  // Build the result
  return lessons.map(lesson => {
    const lessonRecordId = recordMap.get(lesson.id) || null
    const roster = rosterByGroup.get(lesson.group_id) || []
    const attendanceList = lessonRecordId ? (attendanceByRecord.get(lessonRecordId) || []) : []

    // Convert attendance array to Record keyed by roster_item_id
    const attendance: Record<string, Attendance> = {}
    attendanceList.forEach(att => {
      attendance[att.roster_item_id] = att
    })

    const attendanceCount = attendanceList.filter(a => a.status === 'present' || a.status === 'late').length
    const rosterCount = roster.length
    const attendancePercentage = rosterCount > 0 ? Math.round((attendanceCount / rosterCount) * 100) : 0

    return {
      id: lesson.id,
      start_time: lesson.start_time,
      end_time: lesson.end_time,
      is_cancelled: lesson.is_cancelled,
      group_id: lesson.group_id,
      group_name: lesson.groups?.name ?? 'Unknown Group',
      school_name: lesson.groups?.schools?.name ?? 'Unknown School',
      subject_name: lesson.groups?.subjects?.name ?? 'Unknown Subject',
      lesson_record_id: lessonRecordId,
      has_attendance: attendanceList.length > 0,
      attendance_count: attendanceCount,
      roster_count: rosterCount,
      attendance_percentage: attendancePercentage,
      roster,
      attendance
    }
  })
}
