import { supabase } from '../lib/supabase'
import type { RosterItem } from '../types/database'

export async function addRosterStudent(groupId: string, studentName: string): Promise<RosterItem> {
  const { data, error } = await supabase
    .from('roster_items')
    .insert({ group_id: groupId, student_name: studentName.trim() })
    .select()
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to add student')
  }

  return data as RosterItem
}

export async function updateRosterStudent(rosterItemId: string, studentName: string): Promise<RosterItem> {
  const { data, error } = await supabase
    .from('roster_items')
    .update({ student_name: studentName.trim() })
    .eq('id', rosterItemId)
    .select()
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to update student')
  }

  return data as RosterItem
}

export async function deleteRosterStudent(rosterItemId: string): Promise<void> {
  const { error } = await supabase
    .from('roster_items')
    .delete()
    .eq('id', rosterItemId)

  if (error) {
    throw error
  }
}
