import { useState, useEffect } from 'react'
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
  const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set())

  const [editingMaterial, setEditingMaterial] = useState<string | null>(null)
  const [editMaterial, setEditMaterial] = useState({
    title: '',
    description: '',
    file_url: ''
  })
  const [editingTags, setEditingTags] = useState<string[]>([])

  const [tagFilter, setTagFilter] = useState<string>('')
  const [searchFilter, setSearchFilter] = useState('')

  useEffect(() => {
    if (user) {
      fetchMaterials()
      fetchTags()
      fetchSubjects()
    }
  }, [user])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const data = await fetchMaterialsWithTags()
      setMaterials(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const data = await fetchTagsWithSubjects()
      setTags(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchSubjects = async () => {
    try {
      const data = await fetchSubjectsWithSchools()
      setSubjects(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const addMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMaterial.title.trim() || !user) return

    try {
      await createMaterialService(user.id, {
        title: newMaterial.title,
        description: newMaterial.description,
        fileUrl: newMaterial.file_url,
        tagIds: selectedTags
      })

      await fetchMaterials()

      setNewMaterial({ title: '', description: '', file_url: '' })
      setSelectedTags([])
      setShowAddMaterial(false)
    } catch (err: any) {
      if (err.message?.includes('duplicate')) {
        setError('Material already exists')
      } else {
        setError(err.message)
      }
    }
  }

  const updateMaterial = async (materialId: string) => {
    if (!editMaterial.title.trim()) return

    try {
      await updateMaterialService(materialId, {
        title: editMaterial.title,
        description: editMaterial.description,
        fileUrl: editMaterial.file_url,
        tagIds: editingTags
      })

      await fetchMaterials()
      setEditingMaterial(null)
      setEditMaterial({ title: '', description: '', file_url: '' })
      setEditingTags([])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this lesson plan? This will also remove it from all lesson records.')) return

    try {
      await deleteMaterialById(materialId)
      setMaterials(materials.filter(m => m.id !== materialId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const addTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim() || !user) return

    try {
      const tag = await createTagService({
        userId: user.id,
        name: newTagName,
        subjectId: newTagSubject || null
      })

      setTags([...tags, tag])
      setNewTagName('')
      setNewTagSubject('')
      setShowAddTag(false)
    } catch (err: any) {
      if (err.message?.includes('duplicate')) {
        setError('Tag name already exists')
      } else {
        setError(err.message)
      }
    }
  }

  const deleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? This will remove it from all lesson plans.')) return

    try {
      await deleteTagById(tagId)
      setTags(tags.filter(t => t.id !== tagId))
      await fetchMaterials()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Filter materials

  const toggleSubjectCollapse = (subjectId: string) => {
    const newCollapsed = new Set(collapsedSubjects)
    if (newCollapsed.has(subjectId)) {
      newCollapsed.delete(subjectId)
    } else {
      newCollapsed.add(subjectId)
    }
    setCollapsedSubjects(newCollapsed)
  }

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchFilter === '' ||
      material.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchFilter.toLowerCase())

    const matchesTag = tagFilter === '' ||
      material.tags.some(tag => tag.id === tagFilter)

    return matchesSearch && matchesTag
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lesson Plans Library</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddTag(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Tag
          </button>
          <button
            onClick={() => setShowAddMaterial(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Lesson Plan
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Search:</label>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search lesson plans..."
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        {tags.length > 0 && (
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium">Filter by Tag:</label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="">All Tags</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tags Management */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => toggleSubjectCollapse('tags')}
            className="flex items-center gap-2 font-medium hover:text-blue-600"
          >
            <span className="text-lg">
              {collapsedSubjects.has('tags') ? '▶' : '▼'}
            </span>
            Tags ({tags.length})
          </button>
        </div>

        {!collapsedSubjects.has('tags') && (
          <>
            {showAddTag && (
              <form onSubmit={addTag} className="mb-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Tag name (e.g., Grammar, Reading Comprehension, Math Basics)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject</label>
                    <select
                      value={newTagSubject}
                      onChange={(e) => setNewTagSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="">General (not subject-specific)</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({(subject as any).school?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Add Tag
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTag(false)
                        setNewTagName('')
                        setNewTagSubject('')
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Organize tags by subjects */}
            {tags.length > 0 ? (
              <div className="space-y-4">
                {/* General Tags (no subject) */}
                {tags.filter(tag => !tag.subject_id).length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleSubjectCollapse('tags-general')}
                      className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 hover:text-blue-600"
                    >
                      <span className="text-xs">
                        {collapsedSubjects.has('tags-general') ? '▶' : '▼'}
                      </span>
                      General ({tags.filter(tag => !tag.subject_id).length})
                    </button>
                    {!collapsedSubjects.has('tags-general') && (
                      <div className="flex flex-wrap gap-2 ml-4">
                        {tags.filter(tag => !tag.subject_id).map(tag => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-sm"
                          >
                            {tag.name}
                            <button
                              onClick={() => deleteTag(tag.id)}
                              className="text-red-600 hover:text-red-800 ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Subject-specific Tags */}
                {subjects.map(subject => {
                  const subjectTags = tags.filter(tag => tag.subject_id === subject.id)
                  if (subjectTags.length === 0) return null

                  return (
                    <div key={subject.id}>
                      <button
                        onClick={() => toggleSubjectCollapse(`tags-${subject.id}`)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 hover:text-blue-600"
                      >
                        <span className="text-xs">
                          {collapsedSubjects.has(`tags-${subject.id}`) ? '▶' : '▼'}
                        </span>
                        {subject.name} ({subjectTags.length})
                        <span className="text-xs text-gray-500">
                          • {(subject as any).school?.name}
                        </span>
                      </button>
                      {!collapsedSubjects.has(`tags-${subject.id}`) && (
                        <div className="flex flex-wrap gap-2 ml-4">
                          {subjectTags.map(tag => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm"
                            >
                              {tag.name}
                              <button
                                onClick={() => deleteTag(tag.id)}
                                className="text-red-600 hover:text-red-800 ml-1"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <span className="text-gray-500 italic">No tags created yet</span>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add Material Form */}
      {showAddMaterial && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <form onSubmit={addMaterial} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={newMaterial.title}
                onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                placeholder="Lesson plan title"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={newMaterial.description}
                onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                placeholder="Lesson plan description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">File URL</label>
              <input
                type="url"
                value={newMaterial.file_url}
                onChange={(e) => setNewMaterial({ ...newMaterial, file_url: e.target.value })}
                placeholder="https://example.com/file.pdf"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            {tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {tags.map(tag => (
                    <label key={tag.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTags([...selectedTags, tag.id])
                          } else {
                            setSelectedTags(selectedTags.filter(id => id !== tag.id))
                          }
                        }}
                        className="mr-2"
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Lesson Plan
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddMaterial(false)
                  setNewMaterial({ title: '', description: '', file_url: '' })
                  setSelectedTags([])
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Materials Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMaterials.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            {materials.length === 0
              ? 'No lesson plans yet. Add your first lesson plan to get started!'
              : 'No lesson plans match the current filters.'
            }
          </div>
        ) : (
          filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white dark:bg-gray-800 border rounded-lg p-4">
              {editingMaterial === material.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editMaterial.title}
                    onChange={(e) => setEditMaterial({ ...editMaterial, title: e.target.value })}
                    className="w-full font-semibold bg-transparent border-b border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <textarea
                    value={editMaterial.description}
                    onChange={(e) => setEditMaterial({ ...editMaterial, description: e.target.value })}
                    rows={2}
                    className="w-full text-sm bg-transparent border-b border-blue-500 focus:outline-none resize-none"
                    placeholder="Description"
                  />
                  <input
                    type="url"
                    value={editMaterial.file_url}
                    onChange={(e) => setEditMaterial({ ...editMaterial, file_url: e.target.value })}
                    className="w-full text-sm bg-transparent border-b border-blue-500 focus:outline-none"
                    placeholder="File URL"
                  />

                  {tags.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-2">Tags:</div>
                      <div className="grid grid-cols-2 gap-1">
                        {tags.map(tag => (
                          <label key={tag.id} className="flex items-center text-xs">
                            <input
                              type="checkbox"
                              checked={editingTags.includes(tag.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditingTags([...editingTags, tag.id])
                                } else {
                                  setEditingTags(editingTags.filter(id => id !== tag.id))
                                }
                              }}
                              className="mr-1 h-3 w-3"
                            />
                            {tag.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMaterial(material.id)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingMaterial(null)
                        setEditMaterial({ title: '', description: '', file_url: '' })
                        setEditingTags([])
                      }}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{material.title}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingMaterial(material.id)
                          setEditMaterial({
                            title: material.title,
                            description: material.description || '',
                            file_url: material.file_url || ''
                          })
                          setEditingTags(material.tags.map(t => t.id))
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => deleteMaterial(material.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {material.description && (
                    <p className="text-sm text-gray-600 mb-2">{material.description}</p>
                  )}

                  {material.file_url && (
                    <a
                      href={material.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs text-blue-600 hover:text-blue-800 mb-2 break-all"
                    >
                      View File →
                    </a>
                  )}

                  {material.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {material.tags.map(tag => (
                        <span
                          key={tag.id}
                          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-2">
                    Created: {new Date(material.created_at).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}