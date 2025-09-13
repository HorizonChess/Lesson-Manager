import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Group, School, Subject, RosterItem } from '../types/database'

interface Timeslot {
  day: string
  startTime: string
  endTime: string
}

export function Groups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [rosters, setRosters] = useState<Record<string, RosterItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [timeslots, setTimeslots] = useState<Timeslot[]>([])

  // Roster states
  const [showAddStudent, setShowAddStudent] = useState<string | null>(null)
  const [newStudentName, setNewStudentName] = useState('')
  const [editingStudent, setEditingStudent] = useState<string | null>(null)
  const [editStudentName, setEditStudentName] = useState('')

  // Edit group states
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupSchool, setEditGroupSchool] = useState('')
  const [editGroupSubject, setEditGroupSubject] = useState('')
  const [editGroupTimeslots, setEditGroupTimeslots] = useState<Timeslot[]>([])

  // Filter subjects based on selected school
  const filteredSubjects = subjects.filter(subject =>
    selectedSchool ? subject.school_id === selectedSchool : false
  )

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    // Reset subject selection when school changes
    setSelectedSubject('')
  }, [selectedSchool])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch schools
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .order('name')

      if (schoolsError) throw schoolsError

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('name')

      if (subjectsError) throw subjectsError

      // Fetch groups with school and subject names
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          school:schools(name),
          subject:subjects(name)
        `)
        .order('name')

      if (groupsError) throw groupsError

      // Fetch roster items for all groups
      const { data: rosterData, error: rosterError } = await supabase
        .from('roster_items')
        .select('*')
        .order('student_name')

      if (rosterError) throw rosterError

      // Group roster items by group_id
      const rostersByGroup = (rosterData || []).reduce((acc, item) => {
        if (!acc[item.group_id]) {
          acc[item.group_id] = []
        }
        acc[item.group_id].push(item)
        return acc
      }, {} as Record<string, RosterItem[]>)

      setSchools(schoolsData || [])
      setSubjects(subjectsData || [])
      setGroups(groupsData || [])
      setRosters(rostersByGroup)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addTimeslot = () => {
    setTimeslots([...timeslots, { day: '', startTime: '', endTime: '' }])
  }

  const updateTimeslot = (index: number, field: keyof Timeslot, value: string) => {
    const updated = timeslots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    )
    setTimeslots(updated)
  }

  const removeTimeslot = (index: number) => {
    setTimeslots(timeslots.filter((_, i) => i !== index))
  }

  // Edit timeslot helpers
  const addEditTimeslot = () => {
    setEditGroupTimeslots([...editGroupTimeslots, { day: '', startTime: '', endTime: '' }])
  }

  const updateEditTimeslot = (index: number, field: keyof Timeslot, value: string) => {
    const updated = editGroupTimeslots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    )
    setEditGroupTimeslots(updated)
  }

  const removeEditTimeslot = (index: number) => {
    setEditGroupTimeslots(editGroupTimeslots.filter((_, i) => i !== index))
  }

  const addGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim() || !selectedSchool || !selectedSubject) return

    try {
      const { data, error } = await supabase
        .from('groups')
        .insert({
          school_id: selectedSchool,
          subject_id: selectedSubject,
          name: newGroupName.trim(),
          timeslots: timeslots.filter(slot => slot.day && slot.startTime && slot.endTime)
        })
        .select(`
          *,
          school:schools(name),
          subject:subjects(name)
        `)
        .single()

      if (error) throw error

      setGroups([...groups, data])
      setNewGroupName('')
      setSelectedSchool('')
      setSelectedSubject('')
      setTimeslots([])
      setShowAddGroup(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateGroup = async (groupId: string) => {
    if (!editGroupName.trim() || !editGroupSchool || !editGroupSubject) return

    try {
      const { data, error } = await supabase
        .from('groups')
        .update({
          name: editGroupName.trim(),
          school_id: editGroupSchool,
          subject_id: editGroupSubject,
          timeslots: editGroupTimeslots.filter(slot => slot.day && slot.startTime && slot.endTime)
        })
        .eq('id', groupId)
        .select(`
          *,
          school:schools(name),
          subject:subjects(name)
        `)
        .single()

      if (error) throw error

      setGroups(groups.map(g => g.id === groupId ? data : g))
      setEditingGroup(null)
      setEditGroupName('')
      setEditGroupSchool('')
      setEditGroupSubject('')
      setEditGroupTimeslots([])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This will also delete all its lessons and related data.')) return

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error

      setGroups(groups.filter(g => g.id !== groupId))
      // Remove roster items for this group
      const newRosters = { ...rosters }
      delete newRosters[groupId]
      setRosters(newRosters)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const addStudent = async (e: React.FormEvent, groupId: string) => {
    e.preventDefault()
    if (!newStudentName.trim()) return

    try {
      const { data, error } = await supabase
        .from('roster_items')
        .insert({
          group_id: groupId,
          student_name: newStudentName.trim(),
        })
        .select()
        .single()

      if (error) throw error

      setRosters({
        ...rosters,
        [groupId]: [...(rosters[groupId] || []), data]
      })
      setNewStudentName('')
      setShowAddStudent(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateStudent = async (studentId: string, newName: string, groupId: string) => {
    if (!newName.trim()) return

    try {
      const { data, error } = await supabase
        .from('roster_items')
        .update({ student_name: newName.trim() })
        .eq('id', studentId)
        .select()
        .single()

      if (error) throw error

      setRosters({
        ...rosters,
        [groupId]: (rosters[groupId] || []).map(s => s.id === studentId ? data : s)
      })
      setEditingStudent(null)
      setEditStudentName('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteStudent = async (studentId: string, groupId: string) => {
    if (!confirm('Are you sure you want to remove this student from the group?')) return

    try {
      const { error } = await supabase
        .from('roster_items')
        .delete()
        .eq('id', studentId)

      if (error) throw error

      setRosters({
        ...rosters,
        [groupId]: (rosters[groupId] || []).filter(s => s.id !== studentId)
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
        <h2 className="text-2xl font-bold">Groups</h2>
        <button
          onClick={() => setShowAddGroup(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={schools.length === 0}
        >
          Add Group
        </button>
      </div>

      {schools.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          You need to create at least one school with subjects before adding groups.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showAddGroup && (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <form onSubmit={addGroup} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Group Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">School</label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select School</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                  disabled={!selectedSchool}
                >
                  <option value="">Select Subject</option>
                  {filteredSubjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Timeslots</label>
                <button
                  type="button"
                  onClick={addTimeslot}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Add Timeslot
                </button>
              </div>
              {timeslots.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No timeslots added yet</p>
              ) : (
                <div className="space-y-2">
                  {timeslots.map((slot, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-center">
                      <select
                        value={slot.day}
                        onChange={(e) => updateTimeslot(index, 'day', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Day</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeslot(index, 'startTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeslot(index, 'endTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeTimeslot(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Group
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddGroup(false)
                  setNewGroupName('')
                  setSelectedSchool('')
                  setSelectedSubject('')
                  setTimeslots([])
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {editingGroup && (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Edit Group</h3>
          <form onSubmit={(e) => { e.preventDefault(); updateGroup(editingGroup); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Group Name</label>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">School</label>
                <select
                  value={editGroupSchool}
                  onChange={(e) => setEditGroupSchool(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select School</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <select
                  value={editGroupSubject}
                  onChange={(e) => setEditGroupSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                  disabled={!editGroupSchool}
                >
                  <option value="">Select Subject</option>
                  {subjects.filter(s => s.school_id === editGroupSchool).map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Timeslots</label>
                <button
                  type="button"
                  onClick={addEditTimeslot}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Add Timeslot
                </button>
              </div>
              {editGroupTimeslots.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No timeslots added yet</p>
              ) : (
                <div className="space-y-2">
                  {editGroupTimeslots.map((slot, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-center">
                      <select
                        value={slot.day}
                        onChange={(e) => updateEditTimeslot(index, 'day', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Day</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateEditTimeslot(index, 'startTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateEditTimeslot(index, 'endTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeEditTimeslot(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Update Group
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingGroup(null)
                  setEditGroupName('')
                  setEditGroupSchool('')
                  setEditGroupSubject('')
                  setEditGroupTimeslots([])
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
        {groups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No groups yet. Add your first group to get started!
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="bg-white dark:bg-gray-800 border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{group.name}</h3>
                  <p className="text-gray-500">
                    {(group as any).school?.name} • {(group as any).subject?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingGroup(group.id)
                      setEditGroupName(group.name)
                      setEditGroupSchool(group.school_id)
                      setEditGroupSubject(group.subject_id)
                      setEditGroupTimeslots(group.timeslots || [])
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteGroup(group.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Schedule:</h4>
                  {group.timeslots && group.timeslots.length > 0 ? (
                    <div className="space-y-1">
                      {group.timeslots.map((slot: any, index: number) => (
                        <div key={index} className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          {slot.day} {slot.startTime} - {slot.endTime}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No schedule set</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Students:</h4>
                    <button
                      onClick={() => setShowAddStudent(group.id)}
                      className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                    >
                      Add Student
                    </button>
                  </div>

                  {showAddStudent === group.id && (
                    <form onSubmit={(e) => addStudent(e, group.id)} className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          placeholder="Student name"
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                          required
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddStudent(null)
                            setNewStudentName('')
                          }}
                          className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {rosters[group.id] && rosters[group.id].length > 0 ? (
                    <div className="space-y-1">
                      {rosters[group.id].map((student) => (
                        <div
                          key={student.id}
                          className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm"
                        >
                          {editingStudent === student.id ? (
                            <div className="flex gap-2 items-center flex-1">
                              <input
                                type="text"
                                value={editStudentName}
                                onChange={(e) => setEditStudentName(e.target.value)}
                                className="flex-1 bg-transparent border-b border-blue-500 focus:outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateStudent(student.id, editStudentName, group.id)
                                  } else if (e.key === 'Escape') {
                                    setEditingStudent(null)
                                    setEditStudentName('')
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => updateStudent(student.id, editStudentName, group.id)}
                                className="text-green-600 hover:text-green-800 text-xs"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => {
                                  setEditingStudent(null)
                                  setEditStudentName('')
                                }}
                                className="text-gray-600 hover:text-gray-800 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <>
                              <span>{student.student_name}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingStudent(student.id)
                                    setEditStudentName(student.student_name)
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  ✎
                                </button>
                                <button
                                  onClick={() => deleteStudent(student.id, group.id)}
                                  className="text-red-600 hover:text-red-800 text-xs"
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
                    <p className="text-gray-500 text-sm italic">No students yet</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}