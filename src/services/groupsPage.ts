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

// Comprehensive data fetch for Schools page
export interface SchoolsPageData {
  schools: School[]
  allSubjects: Subject[]
  groupsBySchool: Record<string, Group[]>
  groupsBySubject: Record<string, Group[]>
  rostersByGroup: Record<string, RosterItem[]>
}

export async function fetchSchoolsPageData(): Promise<SchoolsPageData> {
  // Fetch schools
  const schools = await fetchSchools()

  // Fetch all user's subjects (now user-owned, no junction table)
  const allSubjects = await fetchSubjects()

  // If no schools, return early
  if (schools.length === 0) {
    return {
      schools,
      allSubjects,
      groupsBySchool: {},
      groupsBySubject: {},
      rostersByGroup: {}
    }
  }

  // Fetch all groups
  const { data: groupsData, error: groupsError} = await supabase
    .from('groups')
    .select('*')
    .order('name')

  if (groupsError) throw groupsError

  // Fetch all rosters
  const rosters = await fetchRosters()

  // Group groups by school_id
  const groupsBySchool = (groupsData || []).reduce<Record<string, Group[]>>((acc, group) => {
    if (!acc[group.school_id]) {
      acc[group.school_id] = []
    }
    acc[group.school_id].push(group)
    return acc
  }, {})

  // Group groups by subject_id
  const groupsBySubject = (groupsData || []).reduce<Record<string, Group[]>>((acc, group) => {
    if (!acc[group.subject_id]) {
      acc[group.subject_id] = []
    }
    acc[group.subject_id].push(group)
    return acc
  }, {})

  return {
    schools,
    allSubjects,
    groupsBySchool,
    groupsBySubject,
    rostersByGroup: rosters
  }
}

// Fetch subjects used by a specific school (via groups)
export async function fetchSchoolSubjects(schoolId: string): Promise<Subject[]> {
  // Get all groups for this school
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('subject_id')
    .eq('school_id', schoolId)

  if (groupsError) throw groupsError

  // Get unique subject IDs
  const subjectIds = [...new Set((groups || []).map(g => g.subject_id))]

  if (subjectIds.length === 0) return []

  // Fetch subjects
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('*')
    .in('id', subjectIds)

  if (subjectsError) throw subjectsError
  return subjects || []
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

// School CRUD operations
export interface CreateSchoolPayload {
  name: string
  userId: string
}

export async function createSchoolWithUser(payload: CreateSchoolPayload): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .insert({ name: payload.name.trim(), user_id: payload.userId })
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create school')
  }

  return data as School
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

// Subject CRUD operations
export interface CreateSubjectPayload {
  name: string
  userId: string
}

export async function createSubjectGlobal(payload: CreateSubjectPayload): Promise<Subject> {
  // Check if subject already exists for this user (case-insensitive)
  const { data: existing } = await supabase
    .from('subjects')
    .select('*')
    .ilike('name', payload.name.trim())
    .eq('user_id', payload.userId)
    .maybeSingle()

  if (existing) {
    throw new Error(`Subject "${existing.name}" already exists`)
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert({ name: payload.name.trim(), user_id: payload.userId })
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create subject')
  }

  return data as Subject
}

export async function findSubjectByName(name: string, userId: string): Promise<Subject | null> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .ilike('name', name.trim())
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error

  return data as Subject | null
}

export async function updateSubjectName(subjectId: string, name: string, userId: string): Promise<Subject> {
  // Check if another subject with this name already exists for this user
  const existingSubject = await findSubjectByName(name, userId)

  if (existingSubject && existingSubject.id !== subjectId) {
    throw new Error(`A subject named "${existingSubject.name}" already exists. Cannot create duplicates.`)
  }

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

export async function deleteSubjectGlobal(subjectId: string, userId: string): Promise<void> {
  // Check if any groups use this subject
  const { data: groupsUsingSubject } = await supabase
    .from('groups')
    .select('id, name, school_id')
    .eq('subject_id', subjectId)

  // If groups exist, move them to "General Teaching"
  if (groupsUsingSubject && groupsUsingSubject.length > 0) {
    // Find or create "General Teaching" subject for this user
    let generalSubjectId: string

    const { data: existingGeneral } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', 'General Teaching')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingGeneral) {
      generalSubjectId = existingGeneral.id
    } else {
      const { data: newGeneral, error: createError } = await supabase
        .from('subjects')
        .insert({ name: 'General Teaching', user_id: userId })
        .select('id')
        .single()

      if (createError) throw createError
      if (!newGeneral) throw new Error('Failed to create General Teaching subject')
      generalSubjectId = newGeneral.id
    }

    // Move all groups to General Teaching
    const { error: updateError } = await supabase
      .from('groups')
      .update({ subject_id: generalSubjectId })
      .eq('subject_id', subjectId)

    if (updateError) throw updateError
  }

  // Delete the subject (RLS ensures user owns it)
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subjectId)

  if (error) throw error
}
