import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  fetchSetupData,
  createSchool,
  updateSchoolName,
  deleteSchoolById,
  createSubject,
  updateSubjectName,
  deleteSubjectById,
  createGroup,
  updateGroupName,
  deleteGroupById,
  addStudent as addStudentService,
  deleteStudent as deleteStudentService,
  type SchoolWithStructure
} from '../services/setupPage'

export function Setup() {
  const { user } = useAuth()
  const [schools, setSchools] = useState<SchoolWithStructure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Expansion states
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set())
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Add/Edit states
  const [showAddSchool, setShowAddSchool] = useState(false)
  const [newSchoolName, setNewSchoolName] = useState('')
  const [showAddSubject, setShowAddSubject] = useState('')
  const [newSubjectName, setNewSubjectName] = useState('')
  const [showAddGroup, setShowAddGroup] = useState('')
  const [newGroupName, setNewGroupName] = useState('')

  // Editing states
  const [editingSchool, setEditingSchool] = useState<string | null>(null)
  const [editSchoolName, setEditSchoolName] = useState('')
  const [editingSubject, setEditingSubject] = useState<string | null>(null)
  const [editSubjectName, setEditSubjectName] = useState('')
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [editGroupName, setEditGroupName] = useState('')

  // Roster management
  const [showRoster, setShowRoster] = useState<string | null>(null)
  const [newStudentName, setNewStudentName] = useState('')

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)

      const data = await fetchSetupData()
      setSchools(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpansion = (type: 'school' | 'subject' | 'group', id: string) => {
    const setters = {
      school: setExpandedSchools,
      subject: setExpandedSubjects,
      group: setExpandedGroups
    }
    const states = {
      school: expandedSchools,
      subject: expandedSubjects,
      group: expandedGroups
    }

    const currentState = states[type]
    const newState = new Set(currentState)

    if (newState.has(id)) {
      newState.delete(id)
    } else {
      newState.add(id)
    }

    setters[type](newState)
  }

  // School operations
  const addSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSchoolName.trim() || !user) return

    try {
      const newSchool = await createSchool(user.id, newSchoolName)
      setSchools([...schools, newSchool])
      setNewSchoolName('')
      setShowAddSchool(false)
      // Auto-expand new school
      setExpandedSchools(new Set([...expandedSchools, newSchool.id]))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateSchool = async (schoolId: string, newName: string) => {
    if (!newName.trim()) return

    try {
      const updated = await updateSchoolName(schoolId, newName)

      setSchools(schools.map(s => s.id === schoolId ? { ...s, name: updated.name } : s))
      setEditingSchool(null)
      setEditSchoolName('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteSchool = async (schoolId: string) => {
    if (!confirm('Are you sure you want to delete this school? This will also delete all its subjects, groups, and related data.')) return

    try {
      await deleteSchoolById(schoolId)

      setSchools(schools.filter(s => s.id !== schoolId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Subject operations
  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubjectName.trim() || !showAddSubject) return

    try {
      const newSubject = await createSubject(showAddSubject, newSubjectName)

      setSchools(schools.map(school =>
        school.id === showAddSubject
          ? { ...school, subjects: [...school.subjects, { ...newSubject, groups: [] }] }
          : school
      ))
      setNewSubjectName('')
      setShowAddSubject('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateSubject = async (subjectId: string, newName: string, schoolId: string) => {
    if (!newName.trim()) return

    try {
      const updatedSubject = await updateSubjectName(subjectId, newName)

      setSchools(schools.map(school =>
        school.id === schoolId
          ? {
              ...school,
              subjects: school.subjects.map(subject =>
                subject.id === subjectId ? { ...subject, name: updatedSubject.name } : subject
              )
            }
          : school
      ))
      setEditingSubject(null)
      setEditSubjectName('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteSubject = async (subjectId: string, schoolId: string) => {
    if (!confirm('Are you sure you want to delete this subject? This will also delete all its groups and related data.')) return

    try {
      await deleteSubjectById(subjectId)

      setSchools(schools.map(school =>
        school.id === schoolId
          ? { ...school, subjects: school.subjects.filter(s => s.id !== subjectId) }
          : school
      ))
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Group operations
  const addGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim() || !showAddGroup) return

    // Find the school ID for this subject
    const schoolId = schools.find(school =>
      school.subjects.some(subject => subject.id === showAddGroup)
    )?.id

    if (!schoolId) return

    try {
      const newGroup = await createGroup(schoolId, showAddGroup, newGroupName)
      setSchools(schools.map(school =>
        school.subjects.some(subject => subject.id === showAddGroup)
          ? {
              ...school,
              subjects: school.subjects.map(subject =>
                subject.id === showAddGroup
                  ? { ...subject, groups: [...subject.groups, newGroup] }
                  : subject
              )
            }
          : school
      ))
      setNewGroupName('')
      setShowAddGroup('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateGroup = async (groupId: string, newName: string) => {
    if (!newName.trim()) return

    try {
      const updatedGroup = await updateGroupName(groupId, newName)

      setSchools(schools.map(school => ({
        ...school,
        subjects: school.subjects.map(subject => ({
          ...subject,
          groups: subject.groups.map(group =>
            group.id === groupId ? { ...group, name: updatedGroup.name } : group
          )
        }))
      })))
      setEditingGroup(null)
      setEditGroupName('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This will also delete all related lessons and data.')) return

    try {
      await deleteGroupById(groupId)

      setSchools(schools.map(school => ({
        ...school,
        subjects: school.subjects.map(subject => ({
          ...subject,
          groups: subject.groups.filter(g => g.id !== groupId)
        }))
      })))
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Roster operations
  const addStudent = async (e: React.FormEvent, groupId: string) => {
    e.preventDefault()
    if (!newStudentName.trim()) return

    try {
      const newRosterItem = await addStudentService(groupId, newStudentName)

      setSchools(schools.map(school => ({
        ...school,
        subjects: school.subjects.map(subject => ({
          ...subject,
          groups: subject.groups.map(group =>
            group.id === groupId
              ? {
                  ...group,
                  roster: [...group.roster, newRosterItem],
                  roster_count: group.roster_count + 1
                }
              : group
          )
        }))
      })))
      setNewStudentName('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteStudent = async (studentId: string, groupId: string) => {
    if (!confirm('Are you sure you want to remove this student?')) return

    try {
      await deleteStudentService(studentId)

      setSchools(schools.map(school => ({
        ...school,
        subjects: school.subjects.map(subject => ({
          ...subject,
          groups: subject.groups.map(group =>
            group.id === groupId
              ? {
                  ...group,
                  roster: group.roster.filter(s => s.id !== studentId),
                  roster_count: group.roster_count - 1
                }
              : group
          )
        }))
      })))
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
        <div>
          <h2 className="text-2xl font-bold">Teaching Structure Setup</h2>
          <p className="text-sm text-gray-500">
            Manage your schools, subjects, and groups in one place
          </p>
        </div>
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

      {/* Add School Form */}
      {showAddSchool && (
        <div className="surface-section-muted p-4">
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
                className="surface-chip text-slate-700 px-4 py-2 hover:opacity-85"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hierarchical Tree */}
      <div className="space-y-3">
        {schools.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No schools yet. Add your first school to get started!
          </div>
        ) : (
          schools.map((school) => (
            <div key={school.id} className="surface-panel">
              {/* School Level */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpansion('school', school.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedSchools.has(school.id) ? '📂' : '📁'}
                    </button>

                    {editingSchool === school.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editSchoolName}
                          onChange={(e) => setEditSchoolName(e.target.value)}
                          className="font-semibold bg-transparent border-b border-blue-500 focus:outline-none"
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
                      <>
                        <span className="text-lg font-semibold">🏫 {school.name}</span>
                        <span className="text-sm text-gray-500">
                          ({school.subjects.length} subjects, {school.subjects.reduce((acc, s) => acc + s.groups.length, 0)} groups)
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddSubject(school.id)}
                      className="text-green-600 hover:text-green-800 text-sm px-2 py-1"
                      title="Add Subject"
                    >
                      + Subject
                    </button>
                    <button
                      onClick={() => {
                        setEditingSchool(school.id)
                        setEditSchoolName(school.name)
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteSchool(school.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Add Subject Form */}
                {showAddSubject === school.id && (
                  <div className="surface-section-muted mt-4 p-3">
                    <form onSubmit={addSubject} className="flex gap-2">
                      <input
                        type="text"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        placeholder="Subject name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddSubject('')
                          setNewSubjectName('')
                        }}
                        className="surface-chip text-slate-700 px-3 py-2 hover:opacity-85"
                      >
                        Cancel
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Subjects Level */}
              {expandedSchools.has(school.id) && (
                <div className="pl-8">
                  {school.subjects.length === 0 ? (
                    <div className="p-4 text-gray-500 italic">
                      No subjects yet. Click "Add Subject" to get started.
                    </div>
                  ) : (
                    school.subjects.map((subject) => (
                      <div key={subject.id} className="border-l-2 border-gray-200 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleExpansion('subject', subject.id)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {expandedSubjects.has(subject.id) ? '📖' : '📕'}
                            </button>

                            {editingSubject === subject.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editSubjectName}
                                  onChange={(e) => setEditSubjectName(e.target.value)}
                                  className="font-medium bg-transparent border-b border-blue-500 focus:outline-none"
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
                                <span className="font-medium">{subject.name}</span>
                                <span className="text-sm text-gray-500">
                                  ({subject.groups.length} groups, {subject.groups.reduce((acc, g) => acc + g.roster_count, 0)} students)
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowAddGroup(subject.id)}
                              className="text-green-600 hover:text-green-800 text-sm px-2 py-1"
                              title="Add Group"
                            >
                              + Group
                            </button>
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
                        </div>

                        {/* Add Group Form */}
                        {showAddGroup === subject.id && (
                          <div className="surface-section-muted mt-2 p-3 ml-6">
                            <form onSubmit={addGroup} className="flex gap-2">
                              <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Group name"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                required
                              />
                              <button
                                type="submit"
                                className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddGroup('')
                                  setNewGroupName('')
                                }}
                                className="surface-chip text-slate-700 px-3 py-2 hover:opacity-85"
                              >
                                Cancel
                              </button>
                            </form>
                          </div>
                        )}

                        {/* Groups Level */}
                        {expandedSubjects.has(subject.id) && (
                          <div className="pl-6 mt-2">
                            {subject.groups.length === 0 ? (
                              <div className="text-gray-500 italic text-sm">
                                No groups yet. Click "Add Group" to get started.
                              </div>
                            ) : (
                              subject.groups.map((group) => (
                                <div key={group.id} className="border-l-2 border-gray-300 pl-4 py-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={() => toggleExpansion('group', group.id)}
                                        className="text-gray-500 hover:text-gray-700"
                                      >
                                        {expandedGroups.has(group.id) ? '👥' : '👤'}
                                      </button>

                                      {editingGroup === group.id ? (
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={editGroupName}
                                            onChange={(e) => setEditGroupName(e.target.value)}
                                            className="font-medium bg-transparent border-b border-blue-500 focus:outline-none"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                updateGroup(group.id, editGroupName)
                                              } else if (e.key === 'Escape') {
                                                setEditingGroup(null)
                                                setEditGroupName('')
                                              }
                                            }}
                                            autoFocus
                                          />
                                          <button
                                            onClick={() => updateGroup(group.id, editGroupName)}
                                            className="text-green-600 hover:text-green-800 text-sm"
                                          >
                                            ✓
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingGroup(null)
                                              setEditGroupName('')
                                            }}
                                            className="text-gray-600 hover:text-gray-800 text-sm"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <span className="font-medium">{group.name}</span>
                                          <span className="text-sm text-gray-500">
                                            ({group.roster_count} students)
                                          </span>
                                        </>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setShowRoster(showRoster === group.id ? null : group.id)}
                                        className="text-purple-600 hover:text-purple-800 text-sm px-2 py-1"
                                        title="Manage Roster"
                                      >
                                        {showRoster === group.id ? 'Hide' : 'Roster'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingGroup(group.id)
                                          setEditGroupName(group.name)
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                      >
                                        ✎
                                      </button>
                                      <button
                                        onClick={() => deleteGroup(group.id)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>

                                  {/* Roster Management */}
                                  {(expandedGroups.has(group.id) || showRoster === group.id) && (
                                    <div className="surface-section-muted mt-3 p-3 ml-6">
                                      <div className="flex justify-between items-center mb-3">
                                        <h5 className="font-medium text-sm">Student Roster ({group.roster_count})</h5>
                                      </div>

                                      {/* Add Student Form */}
                                      <form onSubmit={(e) => addStudent(e, group.id)} className="flex gap-2 mb-3">
                                        <input
                                          type="text"
                                          value={newStudentName}
                                          onChange={(e) => setNewStudentName(e.target.value)}
                                          placeholder="Student name"
                                          className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                                        />
                                        <button
                                          type="submit"
                                          className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm"
                                        >
                                          Add Student
                                        </button>
                                      </form>

                                      {/* Student List */}
                                      {group.roster.length > 0 ? (
                                        <div className="space-y-1">
                                          {group.roster.map((student) => (
                                            <div key={student.id} className="flex justify-between items-center py-1">
                                              <span className="text-sm">{student.student_name}</span>
                                              <button
                                                onClick={() => deleteStudent(student.id, group.id)}
                                                className="text-red-600 hover:text-red-800 text-xs"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-gray-500 italic text-sm">
                                          No students yet. Add students to this group.
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
