import { supabase } from '../lib/supabase'
import type { Lesson, LessonRecord, Attendance } from '../types/database'

export interface LessonsWithRecords {
  lessons: Lesson[]
  lessonRecords: Record<string, LessonRecord>
}

export async function fetchGroupLessons(groupId: string): Promise<LessonsWithRecords> {
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('group_id', groupId)
    .order('start_time', { ascending: false })

  if (lessonsError) {
    throw lessonsError
  }

  if (!lessons || lessons.length === 0) {
    return { lessons: [], lessonRecords: {} }
  }

  const { data: records, error: recordsError } = await supabase
    .from('lesson_records')
    .select('*')
    .in('lesson_id', lessons.map(lesson => lesson.id))

  if (recordsError) {
    throw recordsError
  }

  const byLesson = (records ?? []).reduce<Record<string, LessonRecord>>((acc, record) => {
    acc[record.lesson_id] = record
    return acc
  }, {})

  return { lessons, lessonRecords: byLesson }
}

export interface AttendanceWithStudent extends Attendance {
  student_name?: string
}

export interface GroupAttendanceResult {
  lessons: Lesson[]
  lessonRecords: Record<string, LessonRecord>
  attendanceByRecord: Record<string, AttendanceWithStudent[]>
}

export async function fetchGroupAttendance(
  groupId: string,
  startIso: string,
  endIso: string
): Promise<GroupAttendanceResult> {
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('group_id', groupId)
    .gte('start_time', startIso)
    .lte('start_time', endIso)
    .order('start_time', { ascending: false })

  if (lessonsError) {
    throw lessonsError
  }

  if (!lessons || lessons.length === 0) {
    return { lessons: [], lessonRecords: {}, attendanceByRecord: {} }
  }

  const { data: records, error: recordsError } = await supabase
    .from('lesson_records')
    .select('*')
    .in('lesson_id', lessons.map(lesson => lesson.id))

  if (recordsError) {
    throw recordsError
  }

  const byLesson = (records ?? []).reduce<Record<string, LessonRecord>>((acc, record) => {
    acc[record.lesson_id] = record
    return acc
  }, {})

  if (!records || records.length === 0) {
    return { lessons, lessonRecords: byLesson, attendanceByRecord: {} }
  }

  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('*, roster_item:roster_items(student_name)')
    .in('lesson_record_id', records.map(record => record.id))

  if (attendanceError) {
    throw attendanceError
  }

  const byRecord = (attendance ?? []).reduce<Record<string, AttendanceWithStudent[]>>((acc, entry: any) => {
    const lessonRecordId = entry.lesson_record_id
    if (!acc[lessonRecordId]) {
      acc[lessonRecordId] = []
    }

    acc[lessonRecordId].push({
      ...entry,
      student_name: entry.roster_item?.student_name
    })
    return acc
  }, {})

  return { lessons, lessonRecords: byLesson, attendanceByRecord: byRecord }
}

export async function fetchAttendanceForRecord(recordId: string): Promise<AttendanceWithStudent[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, roster_item:roster_items(student_name)')
    .eq('lesson_record_id', recordId)

  if (error) {
    throw error
  }

  return (data ?? []).map((attendance: any) => ({
    ...attendance,
    student_name: attendance.roster_item?.student_name
  }))
}

export async function updateAttendanceRecord(attendanceId: string, status: 'present' | 'absent' | 'late', note?: string) {
  const { data, error } = await supabase
    .from('attendance')
    .update({ status, note: note ?? null })
    .eq('id', attendanceId)
    .select('*, roster_item:roster_items(student_name)')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to update attendance')
  }

  return {
    ...data,
    student_name: data.roster_item?.student_name
  } as AttendanceWithStudent
}

export async function createAttendanceRecord(recordId: string, rosterItemId: string, status: 'present' | 'absent' | 'late', note?: string) {
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      lesson_record_id: recordId,
      roster_item_id: rosterItemId,
      status,
      note: note ?? null
    })
    .select('*, roster_item:roster_items(student_name)')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create attendance')
  }

  return {
    ...data,
    student_name: data.roster_item?.student_name
  } as AttendanceWithStudent
}

