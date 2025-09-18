import { supabase } from '../lib/supabase'
import type { School, Subject, Group, RosterItem } from '../types/database'

export interface SchoolWithStructure extends School {
  subjects: SubjectWithGroups[]
}

export interface SubjectWithGroups extends Subject {
  groups: GroupWithRoster[]
}

export interface GroupWithRoster extends Group {
  roster: RosterItem[]
  roster_count: number
}

export async function fetchSetupData(): Promise<SchoolWithStructure[]> {
  const { data, error } = await supabase
    .from('schools')
    .select(`*, subjects:subjects(*, groups:groups(*, roster:roster_items(*)))`)
    .order('name')

  if (error) throw error

  const schools = (data ?? []).map((school: any) => ({
    ...school,
    subjects: (school.subjects || []).map((subject: any) => ({
      ...subject,
      groups: (subject.groups || []).map((group: any) => ({
        ...group,
        roster: group.roster || [],
        roster_count: (group.roster || []).length
      }))
    }))
  })) as SchoolWithStructure[]

  return schools
}

export async function createSchool(userId: string, name: string): Promise<SchoolWithStructure> {
  const { data, error } = await supabase
    .from('schools')
    .insert({ user_id: userId, name: name.trim() })
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create school')
  }

  return { ...data, subjects: [] } as SchoolWithStructure
}

export async function updateSchoolName(schoolId: string, name: string): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .update({ name: name.trim() })
    .eq('id', schoolId)
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to update school')
  }

  return data as School
}

export async function deleteSchoolById(schoolId: string): Promise<void> {
  const { error } = await supabase
    .from('schools')
    .delete()
    .eq('id', schoolId)

  if (error) throw error
}

export async function createSubject(schoolId: string, name: string): Promise<Subject> {
  const { data, error } = await supabase
    .from('subjects')
    .insert({ school_id: schoolId, name: name.trim() })
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create subject')
  }

  return data as Subject
}

export async function updateSubjectName(subjectId: string, name: string): Promise<Subject> {
  const { data, error } = await supabase
    .from('subjects')
    .update({ name: name.trim() })
    .eq('id', subjectId)
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to update subject')
  }

  return data as Subject
}

export async function deleteSubjectById(subjectId: string): Promise<void> {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subjectId)

  if (error) throw error
}

export async function createGroup(schoolId: string, subjectId: string, name: string): Promise<GroupWithRoster> {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      school_id: schoolId,
      subject_id: subjectId,
      name: name.trim(),
      timeslots: []
    })
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create group')
  }

  return { ...data, roster: [], roster_count: 0 } as GroupWithRoster
}

export async function updateGroupName(groupId: string, name: string): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .update({ name: name.trim() })
    .eq('id', groupId)
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to update group')
  }

  return data as Group
}

export async function deleteGroupById(groupId: string): Promise<void> {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)

  if (error) throw error
}

export async function addStudent(groupId: string, name: string): Promise<RosterItem> {
  const { data, error } = await supabase
    .from('roster_items')
    .insert({ group_id: groupId, student_name: name.trim() })
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to add student')
  }

  return data as RosterItem
}

export async function deleteStudent(rosterItemId: string): Promise<void> {
  const { error } = await supabase
    .from('roster_items')
    .delete()
    .eq('id', rosterItemId)

  if (error) throw error
}
