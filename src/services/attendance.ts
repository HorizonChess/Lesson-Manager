import { supabase } from '../lib/supabase'
import type { Attendance, RosterItem, LessonRecord } from '../types/database'

export interface AttendanceWithStudent extends Attendance {
  student_name?: string | null
}

export interface LessonAttendanceData {
  lessonRecord: LessonRecord | null
  roster: RosterItem[]
  attendance: Record<string, Attendance> // Keyed by roster_item_id
}

/**
 * Fetch complete attendance data for a lesson
 * Returns lesson record, roster for the group, and attendance records
 */
export async function fetchLessonAttendance(lessonId: string): Promise<LessonAttendanceData> {
  // First, get the lesson to find its group
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, group_id')
    .eq('id', lessonId)
    .single()

  if (lessonError) throw lessonError
  if (!lesson) throw new Error('Lesson not found')

  // Fetch lesson record if it exists
  const { data: lessonRecord } = await supabase
    .from('lesson_records')
    .select('*')
    .eq('lesson_id', lessonId)
    .maybeSingle()

  // Fetch roster for the group
  const { data: roster, error: rosterError } = await supabase
    .from('roster_items')
    .select('*')
    .eq('group_id', lesson.group_id)
    .order('student_name')

  if (rosterError) throw rosterError

  // If no lesson record exists yet, return empty attendance
  if (!lessonRecord) {
    return {
      lessonRecord: null,
      roster: roster ?? [],
      attendance: {}
    }
  }

  // Fetch attendance records for this lesson record
  const { data: attendanceRecords, error: attendanceError } = await supabase
    .from('attendance')
    .select('*')
    .eq('lesson_record_id', lessonRecord.id)

  if (attendanceError) throw attendanceError

  // Convert attendance array to Record keyed by roster_item_id
  const attendance: Record<string, Attendance> = {}
  attendanceRecords?.forEach(record => {
    attendance[record.roster_item_id] = record
  })

  return {
    lessonRecord,
    roster: roster ?? [],
    attendance
  }
}

/**
 * Ensure a lesson record exists for a lesson, creating one if needed
 * Returns the lesson record ID
 */
export async function ensureQuickLessonRecord(lessonId: string): Promise<string> {
  // Check if record exists
  const { data: existing } = await supabase
    .from('lesson_records')
    .select('id')
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (existing) {
    return existing.id
  }

  // Create new record
  const { data: newRecord, error } = await supabase
    .from('lesson_records')
    .insert({
      lesson_id: lessonId,
      covered: '',
      planned: '',
      homework: '',
      notes: ''
    })
    .select('id')
    .single()

  if (error) throw error
  if (!newRecord) throw new Error('Failed to create lesson record')

  return newRecord.id
}

/**
 * Mark attendance for a single student
 */
export async function markStudentAttendance(
  lessonRecordId: string,
  rosterItemId: string,
  status: 'present' | 'absent' | 'late',
  note?: string
): Promise<Attendance> {
  // Check if attendance record already exists
  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('lesson_record_id', lessonRecordId)
    .eq('roster_item_id', rosterItemId)
    .maybeSingle()

  if (existing) {
    // Update existing record
    const { data: updated, error } = await supabase
      .from('attendance')
      .update({
        status,
        note: note || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    return updated
  } else {
    // Create new record
    const { data: created, error } = await supabase
      .from('attendance')
      .insert({
        lesson_record_id: lessonRecordId,
        roster_item_id: rosterItemId,
        status,
        note: note || null
      })
      .select()
      .single()

    if (error) throw error
    return created
  }
}

/**
 * Mark attendance for all students in a lesson
 * Efficient bulk operation for "Mark All Present/Absent/Late"
 */
export async function bulkMarkAttendance(
  lessonRecordId: string,
  rosterItems: RosterItem[],
  status: 'present' | 'absent' | 'late'
): Promise<Attendance[]> {
  // Fetch existing attendance records
  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('lesson_record_id', lessonRecordId)

  const existingMap = new Map<string, Attendance>()
  existing?.forEach(record => {
    existingMap.set(record.roster_item_id, record)
  })

  const toUpdate: { id: string; status: string }[] = []
  const toInsert: { lesson_record_id: string; roster_item_id: string; status: string }[] = []

  rosterItems.forEach(student => {
    const existingRecord = existingMap.get(student.id)
    if (existingRecord) {
      toUpdate.push({ id: existingRecord.id, status })
    } else {
      toInsert.push({
        lesson_record_id: lessonRecordId,
        roster_item_id: student.id,
        status
      })
    }
  })

  // Perform updates
  const updatePromises = toUpdate.map(record =>
    supabase
      .from('attendance')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', record.id)
      .select()
      .single()
  )

  // Perform inserts
  const insertPromise = toInsert.length > 0
    ? supabase.from('attendance').insert(toInsert).select()
    : Promise.resolve({ data: [] })

  const [updateResults, insertResult] = await Promise.all([
    Promise.all(updatePromises),
    insertPromise
  ])

  const updatedRecords = updateResults.map(r => r.data).filter(Boolean) as Attendance[]
  const insertedRecords = (insertResult.data ?? []) as Attendance[]

  return [...updatedRecords, ...insertedRecords]
}

/**
 * Get attendance summary statistics for a lesson
 */
export async function getAttendanceSummary(lessonRecordId: string): Promise<{
  total: number
  present: number
  absent: number
  late: number
  percentage: number
}> {
  const { data: attendanceRecords, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('lesson_record_id', lessonRecordId)

  if (error) throw error

  const total = attendanceRecords?.length ?? 0
  const present = attendanceRecords?.filter(r => r.status === 'present').length ?? 0
  const absent = attendanceRecords?.filter(r => r.status === 'absent').length ?? 0
  const late = attendanceRecords?.filter(r => r.status === 'late').length ?? 0
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0

  return { total, present, absent, late, percentage }
}
