import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { School, Subject } from '../types/database'

export function Schools() {
  const { user } = useAuth()
  const [schools, setSchools] = useState<School[]>([])
  const [subjects, setSubjects] = useState<Record<string, Subject[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddSchool, setShowAddSchool] = useState(false)
  const [newSchoolName, setNewSchoolName] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')

  // Edit states
  const [editingSchool, setEditingSchool] = useState<string | null>(null)
  const [editSchoolName, setEditSchoolName] = useState('')
  const [editingSubject, setEditingSubject] = useState<string | null>(null)
  const [editSubjectName, setEditSubjectName] = useState('')

  // Filter states
  const [schoolFilter, setSchoolFilter] = useState<string>('')

  useEffect(() => {
    if (user) {
      fetchSchools()
    }
  }, [user])

  const fetchSchools = async () => {
    try {
      setLoading(true)
      console.log('Fetching schools for user:', user?.id)
      
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .order('name')

      console.log('Schools query result:', { schoolsData, schoolsError })

      if (schoolsError) throw schoolsError

      setSchools(schoolsData || [])

      // Fetch subjects for each school
      if (schoolsData && schoolsData.length > 0) {
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .in('school_id', schoolsData.map(s => s.id))
          .order('name')

        console.log('Subjects query result:', { subjectsData, subjectsError })

        if (subjectsError) throw subjectsError

        // Group subjects by school_id
        const subjectsBySchool = (subjectsData || []).reduce((acc, subject) => {
          if (!acc[subject.school_id]) {
            acc[subject.school_id] = []
          }
          acc[subject.school_id].push(subject)
          return acc
        }, {} as Record<string, Subject[]>)

        setSubjects(subjectsBySchool)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSchoolName.trim() || !user) return

    try {
      const { data, error } = await supabase
        .from('schools')
        .insert({
          user_id: user.id,
          name: newSchoolName.trim(),
        })
        .select()
        .single()

      if (error) throw error

      setSchools([...schools, data])
      setNewSchoolName('')
      setShowAddSchool(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateSchool = async (schoolId: string, newName: string) => {
    if (!newName.trim()) return

    try {
      const { data, error } = await supabase
        .from('schools')
        .update({ name: newName.trim() })
        .eq('id', schoolId)
        .select()
        .single()

      if (error) throw error

      setSchools(schools.map(s => s.id === schoolId ? data : s))
      setEditingSchool(null)
      setEditSchoolName('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteSchool = async (schoolId: string) => {
    if (!confirm('Are you sure you want to delete this school? This will also delete all its subjects and related data.')) return

    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', schoolId)

      if (error) throw error

      setSchools(schools.filter(s => s.id !== schoolId))
      // Remove subjects for this school
      const newSubjects = { ...subjects }
      delete newSubjects[schoolId]
      setSubjects(newSubjects)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubjectName.trim() || !selectedSchool) return

    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          school_id: selectedSchool,
          name: newSubjectName.trim(),
        })
        .select()
        .single()

      if (error) throw error

      // Add subject to local state
      setSubjects({
        ...subjects,
        [selectedSchool]: [...(subjects[selectedSchool] || []), data]
      })
      setNewSubjectName('')
      setShowAddSubject(false)
      setSelectedSchool(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateSubject = async (subjectId: string, newName: string, schoolId: string) => {
    if (!newName.trim()) return

    try {
      const { data, error } = await supabase
        .from('subjects')
        .update({ name: newName.trim() })
        .eq('id', subjectId)
        .select()
        .single()

      if (error) throw error

      setSubjects({
        ...subjects,
        [schoolId]: (subjects[schoolId] || []).map(s => s.id === subjectId ? data : s)
      })
      setEditingSubject(null)
      setEditSubjectName('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteSubject = async (subjectId: string, schoolId: string) => {
    if (!confirm('Are you sure you want to delete this subject? This will also delete all its groups and related data.')) return

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId)

      if (error) throw error

      // Remove subject from local state
      setSubjects({
        ...subjects,
        [schoolId]: (subjects[schoolId] || []).filter(s => s.id !== subjectId)
      })
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

  // Filter schools based on selected filter
  const filteredSchools = schoolFilter
    ? schools.filter(school => school.id === schoolFilter)
    : schools

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Schools & Subjects</h2>
        <button
          onClick={() => setShowAddSchool(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add School
        </button>
      </div>

      {schools.length > 1 && (
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium">Filter by School:</label>
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="">All Schools</option>
            {schools.map(school => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showAddSchool && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <form onSubmit={addSchool} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">School Name</label>
              <input
                type="text"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                placeholder="Enter school name"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add School
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddSchool(false)
                  setNewSchoolName('')
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddSubject && selectedSchool && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <form onSubmit={addSubject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Subject Name</label>
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Enter subject name"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add Subject
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddSubject(false)
                  setNewSubjectName('')
                  setSelectedSchool(null)
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6">
        {schools.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No schools yet. Add your first school to get started!
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No schools match the selected filter.
          </div>
        ) : (
          filteredSchools.map((school) => (
            <div key={school.id} className="bg-white dark:bg-gray-800 border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  {editingSchool === school.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editSchoolName}
                        onChange={(e) => setEditSchoolName(e.target.value)}
                        className="text-xl font-semibold bg-transparent border-b border-blue-500 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateSchool(school.id, editSchoolName)
                          } else if (e.key === 'Escape') {
                            setEditingSchool(null)
                            setEditSchoolName('')
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => updateSchool(school.id, editSchoolName)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setEditingSchool(null)
                          setEditSchoolName('')
                        }}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-xl font-semibold">{school.name}</h3>
                  )}
                  <p className="text-gray-500 text-sm">
                    Created: {new Date(school.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedSchool(school.id)
                      setShowAddSubject(true)
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Add Subject
                  </button>
                  <button
                    onClick={() => {
                      setEditingSchool(school.id)
                      setEditSchoolName(school.name)
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSchool(school.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Subjects:</h4>
                {subjects[school.id] && subjects[school.id].length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {subjects[school.id].map((subject) => (
                      <div
                        key={subject.id}
                        className="bg-gray-50 dark:bg-gray-700 p-3 rounded flex justify-between items-center"
                      >
                        {editingSubject === subject.id ? (
                          <div className="flex gap-2 items-center flex-1">
                            <input
                              type="text"
                              value={editSubjectName}
                              onChange={(e) => setEditSubjectName(e.target.value)}
                              className="flex-1 bg-transparent border-b border-blue-500 focus:outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateSubject(subject.id, editSubjectName, school.id)
                                } else if (e.key === 'Escape') {
                                  setEditingSubject(null)
                                  setEditSubjectName('')
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => updateSubject(subject.id, editSubjectName, school.id)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setEditingSubject(null)
                                setEditSubjectName('')
                              }}
                              className="text-gray-600 hover:text-gray-800 text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <span>{subject.name}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingSubject(subject.id)
                                  setEditSubjectName(subject.name)
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => deleteSubject(subject.id, school.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                ×
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No subjects yet</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}