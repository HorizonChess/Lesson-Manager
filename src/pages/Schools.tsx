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
        ) : (
          schools.map((school) => (
            <div key={school.id} className="bg-white dark:bg-gray-800 border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{school.name}</h3>
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
                    onClick={() => deleteSchool(school.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Delete School
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
                        <span>{subject.name}</span>
                        <button
                          onClick={() => deleteSubject(subject.id, school.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          ×
                        </button>
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