import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { School, Subject, Group, RosterItem } from '../types/database'
import { Modal } from '../components/Modal'
import { GroupOverview } from '../components/GroupOverview'

interface Timeslot {
  day: string
  startTime: string
  endTime: string
}

export function Schools() {
  const { user } = useAuth()
  const [schools, setSchools] = useState<School[]>([])
  const [subjects, setSubjects] = useState<Record<string, Subject[]>>({})
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]) // All global subjects
  const [groups, setGroups] = useState<Record<string, Group[]>>({}) // groups by subject_id
  const [rosters, setRosters] = useState<Record<string, RosterItem[]>>({}) // roster by group_id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Collapsing states
  const [collapsedSchools, setCollapsedSchools] = useState<Record<string, boolean>>({})
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({})
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  // Add states
  const [showAddSchool, setShowAddSchool] = useState(false)
  const [newSchoolName, setNewSchoolName] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [subjectSelectionMode, setSubjectSelectionMode] = useState<'existing' | 'new'>('existing')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [newSubjectName, setNewSubjectName] = useState('')
  const [showAddGroup, setShowAddGroup] = useState<string | null>(null) // subjectId
  const [newGroupName, setNewGroupName] = useState('')
  const [timeslots, setTimeslots] = useState<Timeslot[]>([])
  const [showAddStudent, setShowAddStudent] = useState<string | null>(null) // groupId
  const [newStudentName, setNewStudentName] = useState('')
  const [showManageSubjects, setShowManageSubjects] = useState(false)

  // Edit states
  const [editingSchool, setEditingSchool] = useState<string | null>(null)
  const [editSchoolName, setEditSchoolName] = useState('')
  const [editingSubject, setEditingSubject] = useState<string | null>(null)
  const [editSubjectName, setEditSubjectName] = useState('')
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupTimeslots, setEditGroupTimeslots] = useState<Timeslot[]>([])
  const [editingStudent, setEditingStudent] = useState<string | null>(null)
  const [editStudentName, setEditStudentName] = useState('')

  // Filter states
  const [schoolFilter, setSchoolFilter] = useState<string>('')

  // Group Overview Modal states
  const [showGroupOverview, setShowGroupOverview] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedGroupSchool, setSelectedGroupSchool] = useState<School | null>(null)
  const [selectedGroupSubject, setSelectedGroupSubject] = useState<Subject | null>(null)
  const [activeGroupTab, setActiveGroupTab] = useState<'students' | 'attendance' | 'lessons' | 'settings'>('students')

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

      // Fetch all global subjects
      const { data: allSubjectsData, error: allSubjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('name')

      if (allSubjectsError) throw allSubjectsError
      setAllSubjects(allSubjectsData || [])

      // Fetch subjects for each school via school_subjects junction
      if (schoolsData && schoolsData.length > 0) {
        const { data: schoolSubjectsData, error: schoolSubjectsError } = await supabase
          .from('school_subjects')
          .select('school_id, subject_id, subjects(*)')
          .in('school_id', schoolsData.map(s => s.id))

        console.log('School subjects query result:', { schoolSubjectsData, schoolSubjectsError })

        if (schoolSubjectsError) throw schoolSubjectsError

        // Extract subjects and add school_id for compatibility with UI
        const subjectsData = (schoolSubjectsData || []).map((ss: any) => ({
          ...ss.subjects,
          school_id: ss.school_id // Add school_id for UI grouping
        }))

        // Fetch groups for each subject
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .order('name')

        console.log('Groups query result:', { groupsData, groupsError })

        if (groupsError) throw groupsError

        // Fetch roster items for all groups
        const { data: rosterData, error: rosterError } = await supabase
          .from('roster_items')
          .select('*')
          .order('student_name')

        console.log('Roster query result:', { rosterData, rosterError })

        if (rosterError) throw rosterError

        // Group subjects by school_id
        const subjectsBySchool = (subjectsData || []).reduce<Record<string, Subject[]>>((acc, subject: any) => {
          if (!acc[subject.school_id]) {
            acc[subject.school_id] = []
          }
          acc[subject.school_id].push(subject)
          return acc
        }, {})

        // Group groups by subject_id
        const groupsBySubject = (groupsData || []).reduce<Record<string, Group[]>>((acc, group) => {
          if (!acc[group.subject_id]) {
            acc[group.subject_id] = []
          }
          acc[group.subject_id].push(group)
          return acc
        }, {})

        // Group roster items by group_id
        const rostersByGroup = (rosterData || []).reduce((acc, item) => {
          if (!acc[item.group_id]) {
            acc[item.group_id] = []
          }
          acc[item.group_id].push(item)
          return acc
        }, {} as Record<string, RosterItem[]>)

        setSubjects(subjectsBySchool)
        setGroups(groupsBySubject)
        setRosters(rostersByGroup)

        // Implement smart collapsing logic
        const newCollapsedSubjects: Record<string, boolean> = {}
        const newCollapsedGroups: Record<string, boolean> = {}

        schoolsData.forEach(school => {
          const schoolSubjects = subjectsBySchool[school.id] || []
          const totalGroups = schoolSubjects.reduce<number>((sum, subject) => {
            return sum + (groupsBySubject[subject.id]?.length || 0)
          }, 0)

          // Smart collapsing: if >6 total groups and multiple subjects, auto-collapse subjects
          if (totalGroups > 6 && schoolSubjects.length > 1) {
            schoolSubjects.forEach(subject => {
              newCollapsedSubjects[subject.id] = true
            })
          }

          // Initialize all groups as collapsed by default (student lists hidden)
          schoolSubjects.forEach(subject => {
            const subjectGroups = groupsBySubject[subject.id] || []
            subjectGroups.forEach(group => {
              newCollapsedGroups[group.id] = true
            })
          })
        })

        setCollapsedSubjects(newCollapsedSubjects)
        setCollapsedGroups(newCollapsedGroups)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Helper functions for collapsing
  const toggleSchoolCollapse = (schoolId: string) => {
    setCollapsedSchools(prev => ({
      ...prev,
      [schoolId]: !prev[schoolId]
    }))
  }

  const toggleSubjectCollapse = (subjectId: string) => {
    setCollapsedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }))
  }

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  // Timeslot helpers
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

  // Group Overview Modal helpers
  const openGroupOverview = (group: Group, school: School, subject: Subject) => {
    setSelectedGroup(group)
    setSelectedGroupSchool(school)
    setSelectedGroupSubject(subject)
    setShowGroupOverview(true)
  }

  const closeGroupOverview = () => {
    setShowGroupOverview(false)
    setSelectedGroup(null)
    setSelectedGroupSchool(null)
    setSelectedGroupSubject(null)
  }

  const handleGroupUpdate = (updatedGroup: Group) => {
    if (!selectedGroupSubject) return

    setGroups({
      ...groups,
      [selectedGroupSubject.id]: (groups[selectedGroupSubject.id] || []).map(g =>
        g.id === updatedGroup.id ? updatedGroup : g
      )
    })
    setSelectedGroup(updatedGroup)
  }

  const handleRosterUpdate = (updatedRoster: RosterItem[]) => {
    if (!selectedGroup) return

    setRosters({
      ...rosters,
      [selectedGroup.id]: updatedRoster
    })
  }

  const handleGroupDelete = (groupId: string) => {
    if (!selectedGroupSubject) return

    // Remove group from groups state
    setGroups({
      ...groups,
      [selectedGroupSubject.id]: (groups[selectedGroupSubject.id] || []).filter(g => g.id !== groupId)
    })

    // Remove roster for this group
    const newRosters = { ...rosters }
    delete newRosters[groupId]
    setRosters(newRosters)
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
    if (!selectedSchool) return

    try {
      let subjectId: string
      let subject: Subject

      if (subjectSelectionMode === 'existing') {
        // Assign existing subject
        if (!selectedSubjectId) {
          setError('Please select a subject')
          return
        }

        const { error: assignError } = await supabase
          .from('school_subjects')
          .insert({ school_id: selectedSchool, subject_id: selectedSubjectId })

        if (assignError) throw assignError

        // Find the subject in allSubjects
        subject = allSubjects.find(s => s.id === selectedSubjectId)!
        subjectId = selectedSubjectId
      } else {
        // Create new subject
        if (!newSubjectName.trim()) {
          setError('Please enter a subject name')
          return
        }

        // Check if subject with this name already exists
        const existingSubject = allSubjects.find(
          s => s.name.toLowerCase() === newSubjectName.trim().toLowerCase()
        )

        if (existingSubject) {
          if (!confirm(`A subject named "${existingSubject.name}" already exists. Do you want to use the existing subject instead of creating a duplicate?`)) {
            return
          }

          // Use existing subject
          const { error: assignError } = await supabase
            .from('school_subjects')
            .insert({ school_id: selectedSchool, subject_id: existingSubject.id })

          if (assignError) throw assignError

          subject = existingSubject
          subjectId = existingSubject.id
        } else {
          // Create new subject
          const { data: newSubject, error: subjectError } = await supabase
            .from('subjects')
            .insert({ name: newSubjectName.trim() })
            .select()
            .single()

          if (subjectError) throw subjectError

          // Assign the new subject to the school
          const { error: assignError } = await supabase
            .from('school_subjects')
            .insert({ school_id: selectedSchool, subject_id: newSubject.id })

          if (assignError) {
            // Rollback: delete the subject if assignment fails
            await supabase.from('subjects').delete().eq('id', newSubject.id)
            throw assignError
          }

          subject = newSubject
          subjectId = newSubject.id

          // Add to allSubjects
          setAllSubjects([...allSubjects, newSubject])
        }
      }

      // Add subject to local state with school_id for UI compatibility
      const subjectWithSchool = { ...subject, school_id: selectedSchool }
      setSubjects({
        ...subjects,
        [selectedSchool]: [...(subjects[selectedSchool] || []), subjectWithSchool as any]
      })

      setNewSubjectName('')
      setSelectedSubjectId('')
      setShowAddSubject(false)
      setSelectedSchool(null)
      setSubjectSelectionMode('existing')
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
    if (!confirm('Remove this subject from the school? (Groups will remain but be unassigned)')) return

    try {
      // Unassign subject from school
      const { error } = await supabase
        .from('school_subjects')
        .delete()
        .eq('school_id', schoolId)
        .eq('subject_id', subjectId)

      if (error) throw error

      // Remove subject from local state for this school
      setSubjects({
        ...subjects,
        [schoolId]: (subjects[schoolId] || []).filter(s => s.id !== subjectId)
      })
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Group CRUD operations
  const addGroup = async (e: React.FormEvent, subjectId: string, schoolId: string) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    try {
      const { data, error } = await supabase
        .from('groups')
        .insert({
          school_id: schoolId,
          subject_id: subjectId,
          name: newGroupName.trim(),
          timeslots: timeslots.filter(slot => slot.day && slot.startTime && slot.endTime)
        })
        .select()
        .single()

      if (error) throw error

      setGroups({
        ...groups,
        [subjectId]: [...(groups[subjectId] || []), data]
      })
      // Set new group as collapsed by default
      setCollapsedGroups({
        ...collapsedGroups,
        [data.id]: true
      })
      setNewGroupName('')
      setTimeslots([])
      setShowAddGroup(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateGroup = async (groupId: string, subjectId: string) => {
    if (!editGroupName.trim()) return

    try {
      const { data, error } = await supabase
        .from('groups')
        .update({
          name: editGroupName.trim(),
          timeslots: editGroupTimeslots.filter(slot => slot.day && slot.startTime && slot.endTime)
        })
        .eq('id', groupId)
        .select()
        .single()

      if (error) throw error

      setGroups({
        ...groups,
        [subjectId]: (groups[subjectId] || []).map(g => g.id === groupId ? data : g)
      })
      setEditingGroup(null)
      setEditGroupName('')
      setEditGroupTimeslots([])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteGroup = async (groupId: string, subjectId: string) => {
    if (!confirm('Are you sure you want to delete this group? This will also delete all its lessons and related data.')) return

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error

      setGroups({
        ...groups,
        [subjectId]: (groups[subjectId] || []).filter(g => g.id !== groupId)
      })
      // Remove roster items for this group
      const newRosters = { ...rosters }
      delete newRosters[groupId]
      setRosters(newRosters)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Student CRUD operations
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

  // Filter schools based on selected filter
  const filteredSchools = schoolFilter
    ? schools.filter(school => school.id === schoolFilter)
    : schools

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">School Overview</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowManageSubjects(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Manage Subjects
          </button>
          <button
            onClick={() => setShowAddSchool(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add School
          </button>
        </div>
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
              <label className="block text-sm font-medium mb-2">Add Subject to School</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSubjectSelectionMode('existing')}
                  className={`px-3 py-1 rounded text-sm ${
                    subjectSelectionMode === 'existing'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Select Existing
                </button>
                <button
                  type="button"
                  onClick={() => setSubjectSelectionMode('new')}
                  className={`px-3 py-1 rounded text-sm ${
                    subjectSelectionMode === 'new'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Create New
                </button>
              </div>

              {subjectSelectionMode === 'existing' ? (
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select a subject...</option>
                  {allSubjects
                    .filter(s => !subjects[selectedSchool]?.some(ss => ss.id === s.id))
                    .map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Enter new subject name"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {subjectSelectionMode === 'existing' ? 'Assign Subject' : 'Create & Assign'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddSubject(false)
                  setNewSubjectName('')
                  setSelectedSubjectId('')
                  setSelectedSchool(null)
                  setSubjectSelectionMode('existing')
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
            <div key={school.id} className="bg-white dark:bg-gray-800 border rounded-lg">
              {/* School Header - Clickable to collapse */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => toggleSchoolCollapse(school.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {collapsedSchools[school.id] ? '📁' : '📂'}
                    </span>
                    {editingSchool === school.id ? (
                      <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
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
                      <div>
                        <h3 className="text-xl font-semibold">{school.name}</h3>
                        <p className="text-gray-500 text-sm">
                          {subjects[school.id]?.length || 0} subjects, {subjects[school.id]?.reduce((sum, s) => sum + (groups[s.id]?.filter(g => g.school_id === school.id).length || 0), 0) || 0} groups
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
              </div>

              {/* School Content - Only shown when not collapsed */}
              {!collapsedSchools[school.id] && (
                <div className="px-6 pb-6">
                  {/* Add Subject Form */}
                  {showAddSubject && selectedSchool === school.id && (
                    <div className="mb-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
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

                  {/* Subjects */}
                  <div className="space-y-4">
                    {subjects[school.id] && subjects[school.id].length > 0 ? (
                      subjects[school.id].map((subject) => (
                        <div key={subject.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg">
                          {/* Subject Header - Clickable to collapse */}
                          <div
                            className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-lg"
                            onClick={() => toggleSubjectCollapse(subject.id)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {collapsedSubjects[subject.id] ? '📄' : '📋'}
                                </span>
                                {editingSubject === subject.id ? (
                                  <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
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
                                  <div>
                                    <h4 className="font-medium">{subject.name}</h4>
                                    <p className="text-sm text-gray-500">
                                      {groups[subject.id]?.filter(g => g.school_id === school.id).length || 0} groups
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setShowAddGroup(subject.id)}
                                  className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                                >
                                  Add Group
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
                          </div>

                          {/* Subject Content - Only shown when not collapsed */}
                          {!collapsedSubjects[subject.id] && (
                            <div className="px-4 pb-4">
                              {/* Add Group Form */}
                              {showAddGroup === subject.id && (
                                <div className="mb-3 bg-white dark:bg-gray-800 p-3 rounded">
                                  <form onSubmit={(e) => addGroup(e, subject.id, school.id)} className="space-y-3">
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Group Name</label>
                                      <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        placeholder="Enter group name"
                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium">Timeslots</label>
                                        <button
                                          type="button"
                                          onClick={addTimeslot}
                                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                                        >
                                          Add Timeslot
                                        </button>
                                      </div>
                                      {timeslots.length === 0 ? (
                                        <p className="text-gray-500 text-xs italic">No timeslots added yet</p>
                                      ) : (
                                        <div className="space-y-1">
                                          {timeslots.map((slot, index) => (
                                            <div key={index} className="grid grid-cols-4 gap-1 items-center">
                                              <select
                                                value={slot.day}
                                                onChange={(e) => updateTimeslot(index, 'day', e.target.value)}
                                                className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-xs"
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
                                                className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-xs"
                                              />
                                              <input
                                                type="time"
                                                value={slot.endTime}
                                                onChange={(e) => updateTimeslot(index, 'endTime', e.target.value)}
                                                className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-xs"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => removeTimeslot(index)}
                                                className="text-red-600 hover:text-red-800 text-xs"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        type="submit"
                                        className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
                                      >
                                        Add Group
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowAddGroup(null)
                                          setNewGroupName('')
                                          setTimeslots([])
                                        }}
                                        className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-400"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              )}

                              {/* Groups */}
                              <div className="space-y-2">
                                {groups[subject.id] && groups[subject.id].length > 0 ? (
                                  groups[subject.id]
                                    .filter((group) => group.school_id === school.id)
                                    .map((group) => (
                                    <div key={group.id} className="bg-white dark:bg-gray-800 p-3 rounded border">
                                      <div className="flex justify-between items-start mb-2">
                                        {editingGroup === group.id ? (
                                          <div className="flex-1">
                                            <div className="flex gap-2 items-center mb-2">
                                              <input
                                                type="text"
                                                value={editGroupName}
                                                onChange={(e) => setEditGroupName(e.target.value)}
                                                className="font-medium bg-transparent border-b border-blue-500 focus:outline-none"
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    updateGroup(group.id, subject.id)
                                                  } else if (e.key === 'Escape') {
                                                    setEditingGroup(null)
                                                    setEditGroupName('')
                                                    setEditGroupTimeslots([])
                                                  }
                                                }}
                                                autoFocus
                                              />
                                              <button
                                                onClick={() => updateGroup(group.id, subject.id)}
                                                className="text-green-600 hover:text-green-800 text-sm"
                                              >
                                                ✓
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setEditingGroup(null)
                                                  setEditGroupName('')
                                                  setEditGroupTimeslots([])
                                                }}
                                                className="text-gray-600 hover:text-gray-800 text-sm"
                                              >
                                                ✕
                                              </button>
                                            </div>
                                            <div>
                                              <div className="flex justify-between items-center mb-1">
                                                <label className="block text-sm font-medium">Timeslots</label>
                                                <button
                                                  type="button"
                                                  onClick={addEditTimeslot}
                                                  className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                                                >
                                                  Add Timeslot
                                                </button>
                                              </div>
                                              {editGroupTimeslots.length === 0 ? (
                                                <p className="text-gray-500 text-xs italic">No timeslots added yet</p>
                                              ) : (
                                                <div className="space-y-1">
                                                  {editGroupTimeslots.map((slot, index) => (
                                                    <div key={index} className="grid grid-cols-4 gap-1 items-center">
                                                      <select
                                                        value={slot.day}
                                                        onChange={(e) => updateEditTimeslot(index, 'day', e.target.value)}
                                                        className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-xs"
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
                                                        className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-xs"
                                                      />
                                                      <input
                                                        type="time"
                                                        value={slot.endTime}
                                                        onChange={(e) => updateEditTimeslot(index, 'endTime', e.target.value)}
                                                        className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-xs"
                                                      />
                                                      <button
                                                        type="button"
                                                        onClick={() => removeEditTimeslot(index)}
                                                        className="text-red-600 hover:text-red-800 text-xs"
                                                      >
                                                        Remove
                                                      </button>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex-1">
                                            <h5
                                              className="font-medium text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                              onClick={() => openGroupOverview(group, school, subject)}
                                              title="Click to open group overview"
                                            >
                                              {group.name}
                                            </h5>
                                            <div className="text-xs text-gray-500 mt-1">
                                              {group.timeslots && group.timeslots.length > 0 ? (
                                                <div className="space-y-1">
                                                  {group.timeslots.map((slot: any, index: number) => (
                                                    <div key={index}>
                                                      {slot.day} {slot.startTime} - {slot.endTime}
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <span className="italic">No schedule set</span>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => setShowAddStudent(group.id)}
                                            className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700"
                                          >
                                            Add Student
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingGroup(group.id)
                                              setEditGroupName(group.name)
                                              setEditGroupTimeslots(group.timeslots || [])
                                            }}
                                            className="text-blue-600 hover:text-blue-800 text-xs"
                                          >
                                            ✎
                                          </button>
                                          <button
                                            onClick={() => deleteGroup(group.id, subject.id)}
                                            className="text-red-600 hover:text-red-800 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      </div>

                                      {/* Add Student Form */}
                                      {showAddStudent === group.id && (
                                        <div className="mb-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                          <form onSubmit={(e) => addStudent(e, group.id)}>
                                            <div className="flex gap-1">
                                              <input
                                                type="text"
                                                value={newStudentName}
                                                onChange={(e) => setNewStudentName(e.target.value)}
                                                placeholder="Student name"
                                                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-xs"
                                                required
                                                autoFocus
                                              />
                                              <button
                                                type="submit"
                                                className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700"
                                              >
                                                Add
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setShowAddStudent(null)
                                                  setNewStudentName('')
                                                }}
                                                className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-400"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </form>
                                        </div>
                                      )}

                                      {/* Students - Collapsible */}
                                      {rosters[group.id] && rosters[group.id].length > 0 && (
                                        <div className="mt-2">
                                          <div
                                            className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 p-1 rounded"
                                            onClick={() => toggleGroupCollapse(group.id)}
                                          >
                                            <span className="text-xs">
                                              {collapsedGroups[group.id] ? '👥' : '👤'}
                                            </span>
                                            <h6 className="text-xs font-medium">Students ({rosters[group.id].length})</h6>
                                          </div>
                                          {!collapsedGroups[group.id] && (
                                            <div className="space-y-1 mt-1">
                                              {rosters[group.id].map((student) => (
                                                <div
                                                  key={student.id}
                                                  className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-1 rounded text-xs"
                                                >
                                                  {editingStudent === student.id ? (
                                                    <div className="flex gap-1 items-center flex-1">
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
                                                        className="text-green-600 hover:text-green-800"
                                                      >
                                                        ✓
                                                      </button>
                                                      <button
                                                        onClick={() => {
                                                          setEditingStudent(null)
                                                          setEditStudentName('')
                                                        }}
                                                        className="text-gray-600 hover:text-gray-800"
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
                                                          className="text-blue-600 hover:text-blue-800"
                                                        >
                                                          ✎
                                                        </button>
                                                        <button
                                                          onClick={() => deleteStudent(student.id, group.id)}
                                                          className="text-red-600 hover:text-red-800"
                                                        >
                                                          ×
                                                        </button>
                                                      </div>
                                                    </>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-gray-500 text-sm italic">No groups yet</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No subjects yet</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Group Overview Modal */}
      {selectedGroup && selectedGroupSchool && selectedGroupSubject && (
        <Modal
          isOpen={showGroupOverview}
          onClose={closeGroupOverview}
          title={`${selectedGroup.name} - Group Overview`}
          size="xl"
        >
          <GroupOverview
            group={selectedGroup}
            school={selectedGroupSchool}
            subject={selectedGroupSubject}
            roster={rosters[selectedGroup.id] || []}
            onClose={closeGroupOverview}
            onGroupUpdate={handleGroupUpdate}
            onRosterUpdate={handleRosterUpdate}
            onGroupDelete={handleGroupDelete}
            activeTab={activeGroupTab}
            onTabChange={setActiveGroupTab}
          />
        </Modal>
      )}

      {/* Manage Global Subjects Modal */}
      <Modal
        isOpen={showManageSubjects}
        onClose={() => setShowManageSubjects(false)}
        title="Manage Global Subjects"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            These subjects can be assigned to any school. Editing or deleting a subject affects all schools using it.
          </p>

          <div className="space-y-2">
            {allSubjects.length === 0 ? (
              <p className="text-gray-500 italic">No subjects created yet</p>
            ) : (
              allSubjects.map((subject) => (
                <div key={subject.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  <span className="font-medium">{subject.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const newName = prompt('Enter new subject name:', subject.name)
                        if (newName && newName.trim() && newName !== subject.name) {
                          try {
                            const { error } = await supabase
                              .from('subjects')
                              .update({ name: newName.trim() })
                              .eq('id', subject.id)

                            if (error) throw error

                            // Update allSubjects
                            setAllSubjects(allSubjects.map(s =>
                              s.id === subject.id ? { ...s, name: newName.trim() } : s
                            ))

                            // Refresh page data
                            fetchSchools()
                          } catch (err: any) {
                            setError(err.message)
                          }
                        }
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ✎ Edit
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          // Check if any groups use this subject
                          const { data: groupsUsingSubject, error: checkError } = await supabase
                            .from('groups')
                            .select('id, name, school_id')
                            .eq('subject_id', subject.id)

                          if (checkError) throw checkError

                          let confirmMessage = `Delete "${subject.name}"?`
                          if (groupsUsingSubject && groupsUsingSubject.length > 0) {
                            confirmMessage = `Delete "${subject.name}"?\n\n${groupsUsingSubject.length} group(s) are using it. They will be moved to "General Teaching" subject.`
                          }

                          if (!confirm(confirmMessage)) return

                          // If groups use this subject, move them to "General Teaching"
                          if (groupsUsingSubject && groupsUsingSubject.length > 0) {
                            // Find or create "General Teaching" subject
                            let { data: generalSubject } = await supabase
                              .from('subjects')
                              .select('id')
                              .eq('name', 'General Teaching')
                              .single()

                            if (!generalSubject) {
                              const { data: newGeneral, error: createError } = await supabase
                                .from('subjects')
                                .insert({ name: 'General Teaching' })
                                .select()
                                .single()

                              if (createError) throw createError
                              generalSubject = newGeneral
                            }

                            // Move all groups to General Teaching
                            const { error: updateError } = await supabase
                              .from('groups')
                              .update({ subject_id: generalSubject.id })
                              .eq('subject_id', subject.id)

                            if (updateError) throw updateError

                            // Ensure General Teaching is assigned to all affected schools
                            const schoolIds = [...new Set(groupsUsingSubject.map(g => g.school_id))]
                            for (const schoolId of schoolIds) {
                              await supabase
                                .from('school_subjects')
                                .upsert({ school_id: schoolId, subject_id: generalSubject.id }, { onConflict: 'school_id,subject_id' })
                            }
                          }

                          // Delete all school_subjects assignments for this subject
                          await supabase
                            .from('school_subjects')
                            .delete()
                            .eq('subject_id', subject.id)

                          // Delete the subject
                          const { error } = await supabase
                            .from('subjects')
                            .delete()
                            .eq('id', subject.id)

                          if (error) throw error

                          // Update allSubjects
                          setAllSubjects(allSubjects.filter(s => s.id !== subject.id))

                          // Refresh page data
                          fetchSchools()
                        } catch (err: any) {
                          setError(err.message)
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      × Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
