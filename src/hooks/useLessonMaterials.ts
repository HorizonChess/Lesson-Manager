import { useState, useCallback } from 'react'
import type { Material } from '../types/database'
import {
  fetchLessonMaterials,
  attachMaterialsToLesson,
  removeMaterialFromLesson
} from '../services/lessonMaterials'

/**
 * Custom hook for managing materials attached to lesson records
 *
 * Encapsulates:
 * - Materials state management
 * - Fetch, attach, and remove operations
 * - Loading states
 * - Error handling
 *
 * This hook eliminates duplication between Dashboard and Lessons pages
 */
export function useLessonMaterials() {
  const [lessonMaterials, setLessonMaterials] = useState<Record<string, Material[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch materials for a specific lesson record
   */
  const fetchMaterials = useCallback(async (lessonRecordId: string) => {
    try {
      setLoading(true)
      setError(null)

      const materials = await fetchLessonMaterials(lessonRecordId)

      setLessonMaterials(prev => ({
        ...prev,
        [lessonRecordId]: materials
      }))

      return materials
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch materials'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Attach materials to a lesson record
   * Replaces all existing materials with the new set
   */
  const attachMaterials = useCallback(async (
    lessonRecordId: string,
    materialIds: string[],
    allMaterials: Material[]
  ) => {
    try {
      setLoading(true)
      setError(null)

      await attachMaterialsToLesson(lessonRecordId, materialIds)

      // Update local state with the attached materials
      const attachedMaterials = allMaterials.filter(m => materialIds.includes(m.id))
      setLessonMaterials(prev => ({
        ...prev,
        [lessonRecordId]: attachedMaterials
      }))
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to attach materials'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Remove a single material from a lesson record
   */
  const removeMaterial = useCallback(async (
    lessonRecordId: string,
    materialId: string
  ) => {
    try {
      setLoading(true)
      setError(null)

      await removeMaterialFromLesson(lessonRecordId, materialId)

      // Update local state by filtering out the removed material
      setLessonMaterials(prev => {
        const updated = { ...prev }
        if (updated[lessonRecordId]) {
          updated[lessonRecordId] = updated[lessonRecordId].filter(m => m.id !== materialId)
        }
        return updated
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to remove material'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Set materials map directly (used when loading from external source)
   */
  const setMaterialsMap = useCallback((map: Record<string, Material[]>) => {
    setLessonMaterials(map)
  }, [])

  /**
   * Clear all materials state
   */
  const clearMaterials = useCallback(() => {
    setLessonMaterials({})
    setError(null)
  }, [])

  return {
    lessonMaterials,
    loading,
    error,
    fetchMaterials,
    attachMaterials,
    removeMaterial,
    setMaterialsMap,
    clearMaterials
  }
}
