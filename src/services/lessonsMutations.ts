import moment from 'moment'
import { supabase } from '../lib/supabase'
import { israeliCalendar } from './israeliCalendar'
import type { Lesson, LessonRecord } from '../types/database'

export interface CreateLessonPayload {
  groupId: string
  startTime: string
  endTime: string
  isCancelled?: boolean
}

export async function createLesson(payload: CreateLessonPayload): Promise<Lesson> {
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      group_id: payload.groupId,
      start_time: payload.startTime,
      end_time: payload.endTime,
      is_cancelled: payload.isCancelled ?? false
    })
    .select(`*, group:groups(name, school:schools(name), subject:subjects(name))`)
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create lesson')
  }

  return data as Lesson
}

export interface UpdateLessonPayload {
  lessonId: string
  startTime?: string
  endTime?: string
  isCancelled?: boolean
}

export async function updateLesson(payload: UpdateLessonPayload): Promise<Lesson> {
  const patch: Record<string, any> = {}
  if (payload.startTime) patch.start_time = payload.startTime
  if (payload.endTime) patch.end_time = payload.endTime
  if (payload.isCancelled !== undefined) patch.is_cancelled = payload.isCancelled

  const { data, error } = await supabase
    .from('lessons')
    .update(patch)
    .eq('id', payload.lessonId)
    .select(`*, group:groups(name, school:schools(name), subject:subjects(name))`)
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

  if (error) throw error
}

export interface LessonRecordPayload {
  lessonId: string
  covered?: string
  planned?: string
  homework?: string
  notes?: string
}

export async function ensureLessonRecord(lessonId: string): Promise<LessonRecord> {
  const { data, error } = await supabase
    .from('lesson_records')
    .select('*')
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  if (data) {
    return data as LessonRecord
  }

  const { data: inserted, error: insertError } = await supabase
    .from('lesson_records')
    .insert({
      lesson_id: lessonId,
      covered: '',
      planned: '',
      homework: '',
      notes: ''
    })
    .select('*')
    .single()

  if (insertError || !inserted) {
    throw insertError ?? new Error('Failed to create lesson record')
  }

  return inserted as LessonRecord
}

export async function updateLessonRecord(payload: LessonRecordPayload): Promise<LessonRecord> {
  const patch: Record<string, any> = {}
  if (payload.covered !== undefined) patch.covered = payload.covered
  if (payload.planned !== undefined) patch.planned = payload.planned
  if (payload.homework !== undefined) patch.homework = payload.homework
  if (payload.notes !== undefined) patch.notes = payload.notes

  const { data, error } = await supabase
    .from('lesson_records')
    .update(patch)
    .eq('lesson_id', payload.lessonId)
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to update lesson record')
  }

  return data as LessonRecord
}

export interface AttendanceUpdatePayload {
  lessonRecordId: string
  rosterItemId: string
  status: 'present' | 'absent' | 'late'
  note?: string | null
}

export async function upsertAttendance(payload: AttendanceUpdatePayload) {
  const { data, error } = await supabase
    .from('attendance')
    .upsert({
      lesson_record_id: payload.lessonRecordId,
      roster_item_id: payload.rosterItemId,
      status: payload.status,
      note: payload.note ?? null
    }, { onConflict: 'lesson_record_id,roster_item_id' })
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to update attendance')
  }

  return data
}

export interface AttendanceDeletePayload {
  lessonRecordId: string
  rosterItemId: string
}

export async function deleteAttendance(payload: AttendanceDeletePayload): Promise<void> {
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('lesson_record_id', payload.lessonRecordId)
    .eq('roster_item_id', payload.rosterItemId)

  if (error) throw error
}

export interface AttendanceReplacementPayload {
  lessonRecordId: string
  records: Array<{ rosterItemId: string; status: 'present' | 'absent' | 'late'; note?: string | null }>
}

export async function replaceAttendance(payload: AttendanceReplacementPayload): Promise<void> {
  await supabase
    .from('attendance')
    .delete()
    .eq('lesson_record_id', payload.lessonRecordId)

  if (payload.records.length === 0) {
    return
  }

  const insertPayload = payload.records.map(record => ({
    lesson_record_id: payload.lessonRecordId,
    roster_item_id: record.rosterItemId,
    status: record.status,
    note: record.note ?? null
  }))

  const { error } = await supabase
    .from('attendance')
    .insert(insertPayload)

  if (error) throw error
}

export interface LessonMaterialPayload {
  lessonRecordId: string
  materialId: string
}

export async function attachMaterial(payload: LessonMaterialPayload): Promise<void> {
  const { error } = await supabase
    .from('lesson_materials')
    .insert({
      lesson_record_id: payload.lessonRecordId,
      material_id: payload.materialId
    })

  if (error) throw error
}

export async function detachMaterial(payload: LessonMaterialPayload): Promise<void> {
  const { error } = await supabase
    .from('lesson_materials')
    .delete()
    .eq('lesson_record_id', payload.lessonRecordId)
    .eq('material_id', payload.materialId)

  if (error) throw error
}

/**
 * Recurring Lessons Operations
 */

export interface GenerateRecurringLessonsPayload {
  groupId: string
  weeks: number
  day: string
  startTime: string
  endTime: string
  startDate?: string
  endDate?: string
}

export interface GenerateRecurringLessonsResult {
  lessons: Lesson[]
  skippedVacationDays: number
}

/**
 * Generate recurring lessons for a group
 * Automatically skips vacation days and invalid school days
 *
 * Lessons start on the first matching weekday on or after startDate (default
 * today) and run until endDate when given, otherwise for the number of weeks.
 *
 * @param payload - Configuration for recurring lessons
 * @returns Array of created lessons and count of skipped vacation days
 */
export async function generateRecurringLessons(
  payload: GenerateRecurringLessonsPayload
): Promise<GenerateRecurringLessonsResult> {
  const { groupId, weeks, day, startTime, endTime, startDate, endDate } = payload

  const lessonsToCreate = []
  let skippedVacationDays = 0

  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day)
  const lessonDate = moment(startDate || undefined).startOf('day')
  lessonDate.add((dayOfWeek - lessonDate.day() + 7) % 7, 'days')
  const lastDate = endDate ? moment(endDate) : lessonDate.clone().add(weeks - 1, 'weeks')

  for (; lessonDate.isSameOrBefore(lastDate, 'day'); lessonDate.add(1, 'week')) {
    const date = lessonDate.toDate()

    // Check if the lesson date falls on a vacation day
    if (israeliCalendar.isVacationDay(date)) {
      skippedVacationDays++
      console.log(`Skipping lesson on ${date.toLocaleDateString()} - vacation day: ${israeliCalendar.getVacationPeriod(date)?.name}`)
      continue
    }

    // Check if it's during summer break or outside school year
    if (!israeliCalendar.isSchoolDay(date)) {
      skippedVacationDays++
      console.log(`Skipping lesson on ${date.toLocaleDateString()} - not a school day`)
      continue
    }

    const lessonDay = lessonDate.format('YYYY-MM-DD')
    lessonsToCreate.push({
      group_id: groupId,
      start_time: new Date(`${lessonDay}T${startTime}`).toISOString(),
      end_time: new Date(`${lessonDay}T${endTime}`).toISOString(),
      is_cancelled: false,
    })
  }

  // Insert all lessons at once
  const { data, error } = await supabase
    .from('lessons')
    .insert(lessonsToCreate)
    .select(`
      *,
      group:groups(
        name,
        school:schools(name),
        subject:subjects(name)
      )
    `)

  if (error) {
    throw error
  }

  return {
    lessons: (data ?? []) as Lesson[],
    skippedVacationDays
  }
}

/**
 * Delete multiple lessons by IDs (e.g., for deleting a recurring pattern)
 *
 * @param lessonIds - Array of lesson IDs to delete
 */
export async function deleteRecurringPattern(lessonIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('lessons')
    .delete()
    .in('id', lessonIds)

  if (error) {
    throw error
  }
}

/**
 * Update a lesson's start and end times
 * Returns the updated lesson with group details
 *
 * @param lessonId - ID of the lesson to update
 * @param startTime - New start time as ISO string or Date
 * @param endTime - New end time as ISO string or Date
 * @returns Updated lesson with group, school, and subject details
 */
export async function updateLessonTime(
  lessonId: string,
  startTime: string | Date,
  endTime: string | Date
): Promise<Lesson> {
  const startTimeISO = typeof startTime === 'string' ? startTime : startTime.toISOString()
  const endTimeISO = typeof endTime === 'string' ? endTime : endTime.toISOString()

  const { data, error } = await supabase
    .from('lessons')
    .update({
      start_time: startTimeISO,
      end_time: endTimeISO
    })
    .eq('id', lessonId)
    .select(`
      *,
      group:groups(
        name,
        school:schools(name),
        subject:subjects(name)
      )
    `)
    .single()

  if (error) {
    throw error
  }

  return data as Lesson
}

/**
 * Bulk update recurring lesson timeslots
 * Updates multiple lessons to a new day and time while preserving their weekly sequence
 *
 * @param lessonIds - Array of lesson IDs to update
 * @param lessonsData - Array of lesson objects with start_time for date calculation
 * @param newDay - Target day of week (e.g., 'Monday', 'Tuesday')
 * @param newStartTime - New start time in HH:mm format
 * @param newEndTime - New end time in HH:mm format
 */
export async function updateRecurringPattern(
  lessonIds: string[],
  lessonsData: Array<{ id: string; start_time: string }>,
  newDay: string,
  newStartTime: string,
  newEndTime: string
): Promise<void> {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const targetDayNumber = dayNames.indexOf(newDay)

  if (targetDayNumber === -1) {
    throw new Error(`Invalid day name: ${newDay}`)
  }

  // Calculate new times for each lesson
  const updates = lessonIds.map(lessonId => {
    const lesson = lessonsData.find(l => l.id === lessonId)
    if (!lesson) return null

    const originalDate = new Date(lesson.start_time)
    const weekStart = new Date(originalDate)
    weekStart.setDate(originalDate.getDate() - originalDate.getDay()) // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0)

    // Calculate new date for target day of week
    const newDate = new Date(weekStart)
    newDate.setDate(weekStart.getDate() + targetDayNumber)

    // Parse time
    const [startHour, startMinute] = newStartTime.split(':').map(Number)
    const [endHour, endMinute] = newEndTime.split(':').map(Number)

    const newStartDateTime = new Date(newDate)
    newStartDateTime.setHours(startHour, startMinute, 0, 0)

    const newEndDateTime = new Date(newDate)
    newEndDateTime.setHours(endHour, endMinute, 0, 0)

    return {
      id: lessonId,
      start_time: newStartDateTime.toISOString(),
      end_time: newEndDateTime.toISOString()
    }
  }).filter((update): update is { id: string; start_time: string; end_time: string } => Boolean(update))

  if (updates.length === 0) {
    throw new Error('No valid lessons to update')
  }

  // Update each lesson individually
  for (const update of updates) {
    const { error } = await supabase
      .from('lessons')
      .update({
        start_time: update.start_time,
        end_time: update.end_time
      })
      .eq('id', update.id)

    if (error) {
      throw error
    }
  }
}
