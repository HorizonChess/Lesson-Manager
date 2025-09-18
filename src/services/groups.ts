import { supabase } from '../lib/supabase'
import type { Group } from '../types/database'

export interface CreateGroupParams {
  name: string
  schoolId: string
  subjectId: string
}

export async function createGroup(params: CreateGroupParams): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .insert([{ name: params.name, school_id: params.schoolId, subject_id: params.subjectId }])
    .select()
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create group')
  }

  return data as Group
}

