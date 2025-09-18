import { supabase } from '../lib/supabase'
import type { Group, School, Subject, RosterItem } from '../types/database'

export interface GroupWithRelations extends Group {
  school?: { name: string | null } | null
  subject?: { name: string | null } | null
}

export async function fetchSchools(): Promise<School[]> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function fetchSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function fetchGroupsWithRelations(): Promise<GroupWithRelations[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('* , school:schools(name), subject:subjects(name)')
    .order('name')

  if (error) throw error
  return (data ?? []) as GroupWithRelations[]
}

export async function fetchRosters(): Promise<Record<string, RosterItem[]>> {
  const { data, error } = await supabase
    .from('roster_items')
    .select('*')
    .order('student_name')

  if (error) throw error

  const rostersByGroup = (data ?? []).reduce<Record<string, RosterItem[]>>((acc, item) => {
    if (!acc[item.group_id]) {
      acc[item.group_id] = []
    }
    acc[item.group_id].push(item as RosterItem)
    return acc
  }, {})

  return rostersByGroup
}

export interface CreateGroupPayload {
  schoolId: string
  subjectId: string
  name: string
  timeslots: unknown[]
}

export async function createGroupWithRelations(payload: CreateGroupPayload): Promise<GroupWithRelations> {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      school_id: payload.schoolId,
      subject_id: payload.subjectId,
      name: payload.name.trim(),
      timeslots: payload.timeslots
    })
    .select('* , school:schools(name), subject:subjects(name)')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create group')
  }

  return data as GroupWithRelations
}

export interface UpdateGroupPayload {
  groupId: string
  schoolId: string
  subjectId: string
  name: string
  timeslots: unknown[]
}

export async function updateGroupWithRelations(payload: UpdateGroupPayload): Promise<GroupWithRelations> {
  const { data, error } = await supabase
    .from('groups')
    .update({
      name: payload.name.trim(),
      school_id: payload.schoolId,
      subject_id: payload.subjectId,
      timeslots: payload.timeslots
    })
    .eq('id', payload.groupId)
    .select('* , school:schools(name), subject:subjects(name)')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to update group')
  }

  return data as GroupWithRelations
}

export async function deleteGroupById(groupId: string): Promise<void> {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)

  if (error) throw error
}

export async function addStudentToGroup(groupId: string, studentName: string): Promise<RosterItem> {
  const { data, error } = await supabase
    .from('roster_items')
    .insert({ group_id: groupId, student_name: studentName.trim() })
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to add student')
  }

  return data as RosterItem
}

export async function updateStudentName(studentId: string, studentName: string): Promise<RosterItem> {
  const { data, error } = await supabase
    .from('roster_items')
    .update({ student_name: studentName.trim() })
    .eq('id', studentId)
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to update student')
  }

  return data as RosterItem
}

export async function deleteStudentById(studentId: string): Promise<void> {
  const { error } = await supabase
    .from('roster_items')
    .delete()
    .eq('id', studentId)

  if (error) throw error
}
