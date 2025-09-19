import { useEffect, useState } from 'react'
import type { FormEventHandler } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { Subject } from '../types/database'
import {
  fetchMaterialsWithTags,
  fetchTagsWithSubjects,
  fetchSubjectsWithSchools,
  createMaterial as createMaterialService,
  updateMaterial as updateMaterialService,
  deleteMaterialById,
  createTag as createTagService,
  deleteTagById,
  type MaterialWithTags,
  type TagWithSubject
} from '../services/materials'
import { MaterialsHeader } from '../components/materials/MaterialsHeader'
import { MaterialsFilters } from '../components/materials/MaterialsFilters'
import { TagManagementPanel } from '../components/materials/TagManagementPanel'
import { MaterialCreateForm } from '../components/materials/MaterialCreateForm'
import { MaterialsGrid } from '../components/materials/MaterialsGrid'

export function Materials() {
  const { user } = useAuth()
  const [materials, setMaterials] = useState<MaterialWithTags[]>([])
  const [tags, setTags] = useState<TagWithSubject[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    file_url: ''
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagSubject, setNewTagSubject] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null)
  const [editMaterial, setEditMaterial] = useState({
    title: '',
    description: '',
    file_url: ''
  })
  const [editingTags, setEditingTags] = useState<string[]>([])

  const [tagFilter, setTagFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')

  useEffect(() => {
    if (user) {
      void loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [materialsData, tagsData, subjectsData] = await Promise.all([
        fetchMaterialsWithTags(),
        fetchTagsWithSubjects(),
        fetchSubjectsWithSchools()
      ])

      setMaterials(materialsData)
      setTags(tagsData)
      setSubjects(subjectsData)
    } catch (err: any) {
      setError(err?.message || 'Failed to load lesson plans.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const handleCreateMaterial = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !newMaterial.title.trim()) {
      return
    }

    try {
      await createMaterialService(user.id, {
        title: newMaterial.title.trim(),
        description: newMaterial.description,
        fileUrl: newMaterial.file_url,
        tagIds: selectedTags
      })

      await loadData()
      resetMaterialForm()
      setShowAddMaterial(false)
    } catch (err: any) {
      const message = err?.message || 'Failed to add lesson plan.'
      if (message.toLowerCase().includes('duplicate')) {
        setError('Material already exists')
      } else {
        setError(message)
      }
    }
  }

  const resetMaterialForm = () => {
    setNewMaterial({ title: '', description: '', file_url: '' })
    setSelectedTags([])
  }

  const handleCreateMaterialFieldChange = (field: 'title' | 'description' | 'file_url', value: string) => {
    setNewMaterial((prev) => ({ ...prev, [field]: value }))
  }

  const handleSelectTag = (tagId: string, checked: boolean) => {
    setSelectedTags((prev) => {
      if (checked) {
        return [...prev, tagId]
      }
      return prev.filter((id) => id !== tagId)
    })
  }

  const handleUpdateMaterial = async (materialId: string) => {
    if (!editMaterial.title.trim()) {
      return
    }

    try {
      await updateMaterialService(materialId, {
        title: editMaterial.title.trim(),
        description: editMaterial.description,
        fileUrl: editMaterial.file_url,
        tagIds: editingTags
      })

      await loadData()
      resetEditingState()
    } catch (err: any) {
      setError(err?.message || 'Failed to update lesson plan.')
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson plan? This will also remove it from all lesson records.')) {
      return
    }

    try {
      await deleteMaterialById(materialId)
      setMaterials((prev) => prev.filter((material) => material.id !== materialId))
    } catch (err: any) {
      setError(err?.message || 'Failed to delete lesson plan.')
    }
  }

  const handleAddTag: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    if (!user || !newTagName.trim()) {
      return
    }

    try {
      const tag = await createTagService({
        userId: user.id,
        name: newTagName.trim(),
        subjectId: newTagSubject || null
      })

      setTags((prev) => [...prev, tag])
      setNewTagName('')
      setNewTagSubject('')
      setShowAddTag(false)
    } catch (err: any) {
      const message = err?.message || 'Failed to create tag.'
      if (message.toLowerCase().includes('duplicate')) {
        setError('Tag name already exists')
      } else {
        setError(message)
      }
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!window.confirm('Are you sure you want to delete this tag? This will remove it from all lesson plans.')) {
      return
    }

    try {
      await deleteTagById(tagId)
      setTags((prev) => prev.filter((tag) => tag.id !== tagId))
      await loadData()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete tag.')
    }
  }

  const handleStartEdit = (material: MaterialWithTags) => {
    setEditingMaterialId(material.id)
    setEditMaterial({
      title: material.title,
      description: material.description || '',
      file_url: material.file_url || ''
    })
    setEditingTags(material.tags.map((tag) => tag.id))
  }

  const handleEditFieldChange = (field: 'title' | 'description' | 'file_url', value: string) => {
    setEditMaterial((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditTagToggle = (tagId: string, checked: boolean) => {
    setEditingTags((prev) => {
      if (checked) {
        return [...prev, tagId]
      }
      return prev.filter((id) => id !== tagId)
    })
  }

  const resetEditingState = () => {
    setEditingMaterialId(null)
    setEditMaterial({ title: '', description: '', file_url: '' })
    setEditingTags([])
  }

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = searchFilter === '' ||
      material.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (material.description || '').toLowerCase().includes(searchFilter.toLowerCase())

    const matchesTag = tagFilter === '' || material.tags.some((tag) => tag.id === tagFilter)

    return matchesSearch && matchesTag
  })

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <MaterialsHeader
        onAddMaterial={() => setShowAddMaterial(true)}
        onAddTag={() => {
          setShowAddTag(true)
          setCollapsedSections((prev) => {
            if (!prev.has('tags-root')) {
              return prev
            }
            const next = new Set(prev)
            next.delete('tags-root')
            return next
          })
        }}
      />

      <MaterialsFilters
        tags={tags}
        searchValue={searchFilter}
        tagFilter={tagFilter}
        onSearchChange={setSearchFilter}
        onTagFilterChange={setTagFilter}
      />

      <TagManagementPanel
        tags={tags}
        subjects={subjects}
        collapsedSections={collapsedSections}
        onToggleSection={handleToggleSection}
        showAddTag={showAddTag}
        onShowAddTagChange={setShowAddTag}
        newTagName={newTagName}
        newTagSubject={newTagSubject}
        onTagNameChange={setNewTagName}
        onTagSubjectChange={setNewTagSubject}
        onAddTag={handleAddTag}
        onDeleteTag={handleDeleteTag}
      />

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
          {error}
        </div>
      )}

      {showAddMaterial && (
        <MaterialCreateForm
          tags={tags}
          title={newMaterial.title}
          description={newMaterial.description}
          fileUrl={newMaterial.file_url}
          selectedTagIds={selectedTags}
          onChange={handleCreateMaterialFieldChange}
          onToggleTag={handleSelectTag}
          onSubmit={handleCreateMaterial}
          onCancel={() => {
            setShowAddMaterial(false)
            resetMaterialForm()
          }}
        />
      )}

      <MaterialsGrid
        materials={filteredMaterials}
        allCount={materials.length}
        tags={tags}
        editingMaterialId={editingMaterialId}
        editMaterial={editMaterial}
        editingTagIds={editingTags}
        onStartEdit={handleStartEdit}
        onChangeField={handleEditFieldChange}
        onToggleTag={handleEditTagToggle}
        onSave={handleUpdateMaterial}
        onCancel={resetEditingState}
        onDelete={handleDeleteMaterial}
      />
    </div>
  )
}

