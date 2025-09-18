import { supabase } from '../lib/supabase'
import type { Material, Tag, Subject } from '../types/database'

export interface MaterialWithTags extends Material {
  tags: Tag[]
}

export interface TagWithSubject extends Tag {
  subject?: Subject | null
}

export async function fetchMaterialsWithTags(): Promise<MaterialWithTags[]> {
  const [{ data: materials, error: materialsError }, { data: materialTags, error: materialTagsError }] = await Promise.all([
    supabase.from('materials').select('*').order('title'),
    supabase
      .from('material_tags')
      .select(`material_id, tag_id, tags(*)`)
  ])

  if (materialsError) throw materialsError
  if (materialTagsError) throw materialTagsError

  const tagsByMaterial: Record<string, Tag[]> = {}
  ;(materialTags || []).forEach((mt: any) => {
    const materialId: string = mt.material_id
    if (!tagsByMaterial[materialId]) {
      tagsByMaterial[materialId] = []
    }
    if (mt.tags) {
      tagsByMaterial[materialId].push(mt.tags as Tag)
    }
  })

  return (materials || []).map(material => ({
    ...material,
    tags: tagsByMaterial[material.id] || []
  })) as MaterialWithTags[]
}

export async function fetchTagsWithSubjects(): Promise<TagWithSubject[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*, subject:subjects(*)')
    .order('name')
  if (error) throw error
  return (data || []) as TagWithSubject[]
}

export async function fetchSubjectsWithSchools(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select(`*, school:schools(name)`) 
    .order('name')
  if (error) throw error
  return (data || []) as Subject[]
}

export interface MaterialPayload {
  title: string
  description?: string | null
  fileUrl?: string | null
  tagIds?: string[]
}

export async function createMaterial(userId: string, payload: MaterialPayload): Promise<void> {
  const { data, error } = await supabase
    .from('materials')
    .insert({
      user_id: userId,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      file_url: payload.fileUrl?.trim() || null
    })
    .select('id')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create material')
  }

  const tagIds = payload.tagIds || []
  if (tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from('material_tags')
      .insert(tagIds.map(tagId => ({ material_id: data.id, tag_id: tagId })))

    if (tagError) {
      throw tagError
    }
  }
}

export async function updateMaterial(materialId: string, payload: MaterialPayload): Promise<void> {
  const { error } = await supabase
    .from('materials')
    .update({
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      file_url: payload.fileUrl?.trim() || null
    })
    .eq('id', materialId)

  if (error) throw error

  await supabase
    .from('material_tags')
    .delete()
    .eq('material_id', materialId)

  const tagIds = payload.tagIds || []
  if (tagIds.length > 0) {
    const { error: tagInsertError } = await supabase
      .from('material_tags')
      .insert(tagIds.map(tagId => ({ material_id: materialId, tag_id: tagId })))

    if (tagInsertError) {
      throw tagInsertError
    }
  }
}

export async function deleteMaterialById(materialId: string): Promise<void> {
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId)

  if (error) throw error
}

export interface TagPayload {
  userId: string
  name: string
  subjectId?: string | null
}

export async function createTag(payload: TagPayload): Promise<Tag> {
  const { data, error } = await supabase
    .from('tags')
    .insert({
      user_id: payload.userId,
      name: payload.name.trim(),
      subject_id: payload.subjectId || null
    })
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create tag')
  }

  return data as Tag
}

export async function deleteTagById(tagId: string): Promise<void> {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId)

  if (error) throw error
}
