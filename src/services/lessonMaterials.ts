import { supabase } from '../lib/supabase'
import type { Material } from '../types/database'

/**
 * Lesson Materials Service
 *
 * Centralized service for managing materials attached to lesson records.
 * This service eliminates duplication between Dashboard and Lessons pages.
 */

/**
 * Fetch all materials for a specific lesson record
 * @param lessonRecordId - The ID of the lesson record
 * @returns Array of materials attached to the lesson record
 */
export async function fetchLessonMaterials(lessonRecordId: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from('lesson_materials')
    .select(`
      material_id,
      materials (*)
    `)
    .eq('lesson_record_id', lessonRecordId)

  if (error) throw error

  // Transform the join response into a flat array of materials
  const materials = (data || [])
    .filter((item: any) => item.materials)
    .map((item: any) => item.materials as Material)

  return materials
}

/**
 * Fetch all materials for multiple lesson records at once
 * Used by Lessons page to load materials for all visible lessons
 * @returns Map of lesson_record_id -> Material[]
 */
export async function fetchLessonMaterialsMap(): Promise<Record<string, Material[]>> {
  const { data, error } = await supabase
    .from('lesson_materials')
    .select(`lesson_record_id, material:materials(*)`)

  if (error) throw error

  const map = (data ?? []).reduce<Record<string, Material[]>>((acc, item: any) => {
    const recordId = item.lesson_record_id
    if (!acc[recordId]) {
      acc[recordId] = []
    }
    if (item.material) {
      acc[recordId].push(item.material as Material)
    }
    return acc
  }, {})

  return map
}

/**
 * Fetch all materials owned by a user
 * @param userId - The user's ID
 * @returns Array of all materials created by the user
 */
export async function fetchAllUserMaterials(userId: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data || []
}

/**
 * Attach materials to a lesson record
 * This replaces all existing materials with the new set
 * @param lessonRecordId - The ID of the lesson record
 * @param materialIds - Array of material IDs to attach
 */
export async function attachMaterialsToLesson(
  lessonRecordId: string,
  materialIds: string[]
): Promise<void> {
  // Remove all existing materials for this lesson record
  const { error: deleteError } = await supabase
    .from('lesson_materials')
    .delete()
    .eq('lesson_record_id', lessonRecordId)

  if (deleteError) throw deleteError

  // Add new materials if any
  if (materialIds.length > 0) {
    const insertData = materialIds.map(materialId => ({
      lesson_record_id: lessonRecordId,
      material_id: materialId
    }))

    const { error: insertError } = await supabase
      .from('lesson_materials')
      .insert(insertData)

    if (insertError) throw insertError
  }
}

/**
 * Remove a single material from a lesson record
 * @param lessonRecordId - The ID of the lesson record
 * @param materialId - The ID of the material to remove
 */
export async function removeMaterialFromLesson(
  lessonRecordId: string,
  materialId: string
): Promise<void> {
  const { error } = await supabase
    .from('lesson_materials')
    .delete()
    .eq('lesson_record_id', lessonRecordId)
    .eq('material_id', materialId)

  if (error) throw error
}

/**
 * Fetch materials for today's lessons (optimized for Dashboard)
 * @param lessonRecordIds - Array of lesson record IDs to fetch materials for
 * @returns Map of lesson_record_id -> Material[]
 */
export async function fetchMaterialsForLessonRecords(
  lessonRecordIds: string[]
): Promise<Record<string, Material[]>> {
  if (lessonRecordIds.length === 0) {
    return {}
  }

  const { data, error } = await supabase
    .from('lesson_materials')
    .select(`
      lesson_record_id,
      material:materials (*)
    `)
    .in('lesson_record_id', lessonRecordIds)

  if (error) throw error

  const map = (data ?? []).reduce<Record<string, Material[]>>((acc, item: any) => {
    const recordId = item.lesson_record_id
    if (!acc[recordId]) {
      acc[recordId] = []
    }
    if (item.material) {
      acc[recordId].push(item.material as Material)
    }
    return acc
  }, {})

  return map
}
