import { supabase } from '../lib/supabase'
import type { School } from '../types/database'

export interface CreateSchoolParams {
  name: string
  userId: string
}

export async function deleteSchoolsByUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('schools')
    .delete()
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

export async function createSchool(params: CreateSchoolParams): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .insert([{ name: params.name, user_id: params.userId }])
    .select()
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create school')
  }

  return data as School
}

