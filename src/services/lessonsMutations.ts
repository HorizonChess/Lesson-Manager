import { supabase } from '../lib/supabase'
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
