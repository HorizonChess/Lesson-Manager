import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import * as groupsPageService from '../services/groupsPage'
import type { School, Subject, Group, RosterItem } from '../types/database'
import { Modal } from '../components/Modal'
import { GroupOverview } from '../components/GroupOverview'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Settings,
  School as SchoolIcon,
  BookOpen,
  Users,
  ChevronDown,
  ChevronRight,
  Search,
  ChevronsDown,
  ChevronsRight
} from 'lucide-react'

interface Timeslot {
  day: string
  startTime: string
  endTime: string
}

export function Schools() {
  const { user } = useAuth()

  // Data state
  const [schools, setSchools] = useState<School[]>([])
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [schoolSubjectsBySchool, setSchoolSubjectsBySchool] = useState<Record<string, Subject[]>>({})
  const [groupsBySchool, setGroupsBySchool] = useState<Record<string, Group[]>>({})
  const [groupsBySubject, setGroupsBySubject] = useState<Record<string, Group[]>>({})
  const [rostersByGroup, setRostersByGroup] = useState<Record<string, RosterItem[]>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state - Search & Filter
  const [searchQuery, setSearchQuery] = useState('')

  // UI state - Collapse
  const [collapsedSchools, setCollapsedSchools] = useState<Record<string, boolean>>({})
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({}) // key: schoolId-subjectId
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  // UI state - Modals
  const [showManageSubjects, setShowManageSubjects] = useState(false)
  const [showGroupOverview, setShowGroupOverview] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedGroupSchool, setSelectedGroupSchool] = useState<School | null>(null)
  const [selectedGroupSubject, setSelectedGroupSubject] = useState<Subject | null>(null)

  // UI state - School CRUD
  const [showAddSchool, setShowAddSchool] = useState(false)
  const [newSchoolName, setNewSchoolName] = useState('')
  const [editingSchool, setEditingSchool] = useState<string | null>(null)
  const [editSchoolName, setEditSchoolName] = useState('')

  // UI state - Subject CRUD
  const [showAddSubject, setShowAddSubject] = useState<string | null>(null) // schoolId
  const [newSubjectName, setNewSubjectName] = useState('')
  const [editingSubject, setEditingSubject] = useState<string | null>(null) // subjectId
  const [editSubjectName, setEditSubjectName] = useState('')

  // UI state - Group CRUD
  const [showAddGroup, setShowAddGroup] = useState<{ schoolId: string; subjectId: string } | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupTimeslots, setNewGroupTimeslots] = useState<Timeslot[]>([])
  const [editingGroup, setEditingGroup] = useState<string | null>(null) // groupId
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupTimeslots, setEditGroupTimeslots] = useState<Timeslot[]>([])

  // UI state - Roster CRUD
  const [showAddStudent, setShowAddStudent] = useState<string | null>(null) // groupId
  const [newStudentName, setNewStudentName] = useState('')
  const [editingStudent, setEditingStudent] = useState<string | null>(null) // rosterId
  const [editStudentName, setEditStudentName] = useState('')

  // Load all data
  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await groupsPageService.fetchSchoolsPageData()

      setSchools(data.schools)
      setAllSubjects(data.allSubjects)
      setSchoolSubjectsBySchool(data.schoolSubjectsBySchool)
      setGroupsBySchool(data.groupsBySchool)
      setGroupsBySubject(data.groupsBySubject)
      setRostersByGroup(data.rostersByGroup)

      // Smart collapsing: collapse groups by default
      const newCollapsedGroups: Record<string, boolean> = {}
      Object.values(data.groupsBySchool).flat().forEach(group => {
        newCollapsedGroups[group.id] = true
      })
      setCollapsedGroups(newCollapsedGroups)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // ==================== SCHOOL CRUD ====================

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newSchoolName.trim()) return

    try {
      const school = await groupsPageService.createSchoolWithUser({
        name: newSchoolName.trim(),
        userId: user.id
      })

      setSchools([...schools, school])
      setNewSchoolName('')
      setShowAddSchool(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdateSchool = async (schoolId: string, newName: string) => {
    if (!newName.trim()) return

    try {
      const school = await groupsPageService.updateSchoolName(schoolId, newName.trim())

      setSchools(schools.map(s => s.id === schoolId ? school : s))
      setEditingSchool(null)
      setEditSchoolName('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteSchool = async (schoolId: string) => {
    if (!confirm('Delete this school? All groups and students will also be deleted.')) return

    try {
      await groupsPageService.deleteSchoolById(schoolId)

      setSchools(schools.filter(s => s.id !== schoolId))

      // Remove groups for this school
      const newGroupsBySchool = { ...groupsBySchool }
      delete newGroupsBySchool[schoolId]
      setGroupsBySchool(newGroupsBySchool)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ==================== SUBJECT CRUD ====================

  const handleAddSubject = async (e: React.FormEvent, schoolId: string) => {
    e.preventDefault()
    if (!user || !newSubjectName.trim()) return

    try {
      // Check if subject already exists
      const existingSubject = allSubjects.find(
        s => s.name.toLowerCase() === newSubjectName.trim().toLowerCase()
      )

      let subject: Subject
      if (existingSubject) {
        // Use existing subject
        subject = existingSubject
      } else {
        // Create new subject
        subject = await groupsPageService.createSubjectGlobal({
          name: newSubjectName.trim(),
          userId: user.id
        })
        setAllSubjects([...allSubjects, subject])
      }

      // Assign subject to school via junction table
      await groupsPageService.assignSubjectToSchool(schoolId, subject.id)

      // Update local state
      setSchoolSubjectsBySchool({
        ...schoolSubjectsBySchool,
        [schoolId]: [...(schoolSubjectsBySchool[schoolId] || []), subject]
      })

      setNewSubjectName('')
      setShowAddSubject(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdateSubject = async (subjectId: string, newName: string) => {
    if (!user || !newName.trim()) return

    try {
      const subject = await groupsPageService.updateSubjectName(subjectId, newName.trim(), user.id)

      setAllSubjects(allSubjects.map(s => s.id === subjectId ? subject : s))
      setEditingSubject(null)
      setEditSubjectName('')
      await fetchData() // Refresh to see changes
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    if (!user) return

    const groupCount = groupsBySubject[subjectId]?.length || 0
    let confirmMsg = `Delete subject "${allSubjects.find(s => s.id === subjectId)?.name}"?`
    if (groupCount > 0) {
      confirmMsg += `\n\n${groupCount} group(s) will be moved to "General Teaching".`
    }

    if (!confirm(confirmMsg)) return

    try {
      await groupsPageService.deleteSubjectGlobal(subjectId, user.id)

      setAllSubjects(allSubjects.filter(s => s.id !== subjectId))
      await fetchData() // Refresh to see group reassignments
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ==================== GROUP CRUD ====================

  const handleAddGroup = async (e: React.FormEvent, schoolId: string, subjectId: string) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    try {
      const group = await groupsPageService.createGroupWithRelations({
        schoolId,
        subjectId,
        name: newGroupName.trim(),
        timeslots: newGroupTimeslots.filter(t => t.day && t.startTime && t.endTime)
      })

      setGroupsBySchool({
        ...groupsBySchool,
        [schoolId]: [...(groupsBySchool[schoolId] || []), group]
      })
      setGroupsBySubject({
        ...groupsBySubject,
        [subjectId]: [...(groupsBySubject[subjectId] || []), group]
      })
      setCollapsedGroups({ ...collapsedGroups, [group.id]: true })

      setNewGroupName('')
      setNewGroupTimeslots([])
      setShowAddGroup(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdateGroup = async (groupId: string, schoolId: string, subjectId: string) => {
    if (!editGroupName.trim()) return

    try {
      const group = await groupsPageService.updateGroupWithRelations({
        groupId,
        schoolId,
        subjectId,
        name: editGroupName.trim(),
        timeslots: editGroupTimeslots.filter(t => t.day && t.startTime && t.endTime)
      })

      setGroupsBySchool({
        ...groupsBySchool,
        [schoolId]: (groupsBySchool[schoolId] || []).map(g => g.id === groupId ? group : g)
      })
      setGroupsBySubject({
        ...groupsBySubject,
        [subjectId]: (groupsBySubject[subjectId] || []).map(g => g.id === groupId ? group : g)
      })

      setEditingGroup(null)
      setEditGroupName('')
      setEditGroupTimeslots([])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteGroup = async (groupId: string, schoolId: string, subjectId: string) => {
    if (!confirm('Delete this group? All lessons and student records will be deleted.')) return

    try {
      await groupsPageService.deleteGroupById(groupId)

      setGroupsBySchool({
        ...groupsBySchool,
        [schoolId]: (groupsBySchool[schoolId] || []).filter(g => g.id !== groupId)
      })
      setGroupsBySubject({
        ...groupsBySubject,
        [subjectId]: (groupsBySubject[subjectId] || []).filter(g => g.id !== groupId)
      })

      const newRosters = { ...rostersByGroup }
      delete newRosters[groupId]
      setRostersByGroup(newRosters)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ==================== ROSTER CRUD ====================

  const handleAddStudent = async (e: React.FormEvent, groupId: string) => {
    e.preventDefault()
    if (!newStudentName.trim()) return

    try {
      const student = await groupsPageService.addStudentToGroup(groupId, newStudentName.trim())

      setRostersByGroup({
        ...rostersByGroup,
        [groupId]: [...(rostersByGroup[groupId] || []), student]
      })

      setNewStudentName('')
      setShowAddStudent(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdateStudent = async (studentId: string, newName: string, groupId: string) => {
    if (!newName.trim()) return

    try {
      const student = await groupsPageService.updateStudentName(studentId, newName.trim())

      setRostersByGroup({
        ...rostersByGroup,
        [groupId]: (rostersByGroup[groupId] || []).map(s => s.id === studentId ? student : s)
      })

      setEditingStudent(null)
      setEditStudentName('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteStudent = async (studentId: string, groupId: string) => {
    if (!confirm('Remove this student from the group?')) return

    try {
      await groupsPageService.deleteStudentById(studentId)

      setRostersByGroup({
        ...rostersByGroup,
        [groupId]: (rostersByGroup[groupId] || []).filter(s => s.id !== studentId)
      })
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ==================== HELPER FUNCTIONS ====================

  const toggleSchoolCollapse = (schoolId: string) => {
    setCollapsedSchools(prev => ({ ...prev, [schoolId]: !prev[schoolId] }))
  }

  const toggleSubjectCollapse = (schoolId: string, subjectId: string) => {
    const key = `${schoolId}-${subjectId}`
    setCollapsedSubjects(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

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
    if (!selectedGroupSchool || !selectedGroupSubject) return

    setGroupsBySchool({
      ...groupsBySchool,
      [selectedGroupSchool.id]: (groupsBySchool[selectedGroupSchool.id] || []).map(g =>
        g.id === updatedGroup.id ? updatedGroup : g
      )
    })
    setGroupsBySubject({
      ...groupsBySubject,
      [selectedGroupSubject.id]: (groupsBySubject[selectedGroupSubject.id] || []).map(g =>
        g.id === updatedGroup.id ? updatedGroup : g
      )
    })
    setSelectedGroup(updatedGroup)
  }

  const handleRosterUpdate = (updatedRoster: RosterItem[]) => {
    if (!selectedGroup) return
    setRostersByGroup({ ...rostersByGroup, [selectedGroup.id]: updatedRoster })
  }

  const handleGroupDeleteFromModal = (groupId: string) => {
    if (!selectedGroupSchool || !selectedGroupSubject) return

    setGroupsBySchool({
      ...groupsBySchool,
      [selectedGroupSchool.id]: (groupsBySchool[selectedGroupSchool.id] || []).filter(g => g.id !== groupId)
    })
    setGroupsBySubject({
      ...groupsBySubject,
      [selectedGroupSubject.id]: (groupsBySubject[selectedGroupSubject.id] || []).filter(g => g.id !== groupId)
    })

    const newRosters = { ...rostersByGroup }
    delete newRosters[groupId]
    setRostersByGroup(newRosters)
  }

  // Timeslot helpers
  const addTimeslot = () => {
    setNewGroupTimeslots([...newGroupTimeslots, { day: '', startTime: '', endTime: '' }])
  }

  const updateTimeslot = (index: number, field: keyof Timeslot, value: string) => {
    setNewGroupTimeslots(newGroupTimeslots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    ))
  }

  const removeTimeslot = (index: number) => {
    setNewGroupTimeslots(newGroupTimeslots.filter((_, i) => i !== index))
  }

  const addEditTimeslot = () => {
    setEditGroupTimeslots([...editGroupTimeslots, { day: '', startTime: '', endTime: '' }])
  }

  const updateEditTimeslot = (index: number, field: keyof Timeslot, value: string) => {
    setEditGroupTimeslots(editGroupTimeslots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    ))
  }

  const removeEditTimeslot = (index: number) => {
    setEditGroupTimeslots(editGroupTimeslots.filter((_, i) => i !== index))
  }

  // Get subjects used by a school (via groups)
  const getSchoolSubjects = (schoolId: string): Subject[] => {
    const schoolGroups = groupsBySchool[schoolId] || []
    const subjectIds = new Set(schoolGroups.map(g => g.subject_id))
    return allSubjects.filter(s => subjectIds.has(s.id))
  }

  // Get groups for a school+subject combination, sorted by schedule
  const getSchoolSubjectGroups = (schoolId: string, subjectId: string): Group[] => {
    const groups = (groupsBySchool[schoolId] || []).filter(g => g.subject_id === subjectId)

    return groups.sort((a, b) => {
      const aHasSchedule = a.timeslots && a.timeslots.length > 0
      const bHasSchedule = b.timeslots && b.timeslots.length > 0

      // Groups with schedules come first
      if (aHasSchedule && !bHasSchedule) return -1
      if (!aHasSchedule && bHasSchedule) return 1

      // Both have schedules - sort by day and time
      if (aHasSchedule && bHasSchedule) {
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        const aFirstSlot = a.timeslots![0]
        const bFirstSlot = b.timeslots![0]

        const aDayIndex = dayOrder.indexOf(aFirstSlot.day)
        const bDayIndex = dayOrder.indexOf(bFirstSlot.day)

        if (aDayIndex !== bDayIndex) {
          return aDayIndex - bDayIndex
        }

        // Same day - sort by start time
        return aFirstSlot.startTime.localeCompare(bFirstSlot.startTime)
      }

      // Both have no schedule - sort alphabetically
      return a.name.localeCompare(b.name)
    })
  }

  // Filter schools/subjects/groups based on search query
  const filteredSchools = schools.filter(school => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true

    // Check school name
    if (school.name.toLowerCase().includes(query)) return true

    // Check subjects under this school
    const schoolSubjects = schoolSubjectsBySchool[school.id] || []
    if (schoolSubjects.some(subject => subject.name.toLowerCase().includes(query))) return true

    // Check groups under this school
    const schoolGroups = groupsBySchool[school.id] || []
    if (schoolGroups.some(group => group.name.toLowerCase().includes(query))) return true

    return false
  })

  // Helper: Check if subject matches search or has matching groups
  const subjectMatchesSearch = (subject: Subject, schoolId: string) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true

    // Check subject name
    if (subject.name.toLowerCase().includes(query)) return true

    // Check groups under this subject
    const subjectGroups = getSchoolSubjectGroups(schoolId, subject.id)
    return subjectGroups.some(group => group.name.toLowerCase().includes(query))
  }

  // Helper: Check if group matches search
  const groupMatchesSearch = (group: Group) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    return group.name.toLowerCase().includes(query)
  }

  // Expand/collapse all schools
  const expandAllSchools = () => {
    const expanded: Record<string, boolean> = {}
    filteredSchools.forEach(school => {
      expanded[school.id] = false // false = expanded
    })
    setCollapsedSchools(expanded)
  }

  const collapseAllSchools = () => {
    const collapsed: Record<string, boolean> = {}
    filteredSchools.forEach(school => {
      collapsed[school.id] = true
    })
    setCollapsedSchools(collapsed)
  }

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <div className="p-8">Please log in</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">School Overview</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowManageSubjects(true)}
          >
            <Settings size={16} />
            Manage Subjects
          </Button>
          <Button
            variant="default"
            onClick={() => setShowAddSchool(true)}
          >
            <Plus size={16} />
            Add School
          </Button>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schools, subjects, or groups..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
          />
          {searchQuery && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X size={16} />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={expandAllSchools}
            title="Expand all schools"
          >
            <ChevronsDown size={16} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={collapseAllSchools}
            title="Collapse all schools"
          >
            <ChevronsRight size={16} />
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      {/* Add School Form */}
      {showAddSchool && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <form onSubmit={handleAddSchool} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">School Name</label>
              <input
                type="text"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                placeholder="Enter school name"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                required
                autoFocus
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

      {/* Schools List */}
      <div className="grid gap-4">
        {schools.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No schools yet. Add your first school to get started!
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">No results found</p>
            <p className="text-sm mt-2">Try adjusting your search query</p>
          </div>
        ) : (
          filteredSchools.map((school) => {
            const totalGroups = (groupsBySchool[school.id] || []).length

            return (
              <div key={school.id} className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 dark:border-gray-700 dark:bg-gray-800">
                {/* School Header */}
                <div
                  className="p-4 cursor-pointer bg-gray-50/50 hover:bg-gray-100/50 transition-colors rounded-t-lg border-b border-gray-200 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 dark:border-gray-700"
                  onClick={() => toggleSchoolCollapse(school.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="text-blue-600 dark:text-blue-400">
                        {collapsedSchools[school.id] ? <ChevronRight size={24} /> : <ChevronDown size={24} />}
                      </div>
                      <SchoolIcon size={24} className="text-blue-600 dark:text-blue-400" />
                      {editingSchool === school.id ? (
                        <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editSchoolName}
                            onChange={(e) => setEditSchoolName(e.target.value)}
                            className="text-xl font-semibold bg-transparent border-b border-blue-500 focus:outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateSchool(school.id, editSchoolName)
                              if (e.key === 'Escape') {
                                setEditingSchool(null)
                                setEditSchoolName('')
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateSchool(school.id, editSchoolName)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check size={18} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingSchool(null)
                              setEditSchoolName('')
                            }}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <X size={18} />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{school.name}</h3>
                          <div className="flex gap-2 mt-1.5">
                            <Badge variant="secondary">
                              <BookOpen size={12} className="text-purple-600 dark:text-purple-400" />
                              {(schoolSubjectsBySchool[school.id] || []).length} subjects
                            </Badge>
                            <Badge variant="secondary">
                              <Users size={12} className="text-orange-600 dark:text-orange-400" />
                              {totalGroups} groups
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddSubject(school.id)}
                      >
                        <Plus size={14} />
                        Add Subject
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSchool(school.id)
                          setEditSchoolName(school.name)
                        }}
                      >
                        <Edit2 size={14} />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSchool(school.id)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>

                {/* School Content */}
                {!collapsedSchools[school.id] && (
                  <div className="px-6 pb-6">
                    {/* Add Subject Form */}
                    {showAddSubject === school.id && (
                      <div className="mb-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <form onSubmit={(e) => handleAddSubject(e, school.id)} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Subject Name</label>
                            <input
                              type="text"
                              value={newSubjectName}
                              onChange={(e) => setNewSubjectName(e.target.value)}
                              placeholder="Enter subject name (existing or new)"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                              required
                              autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Tip: If a subject with this name exists, it will be used instead of creating a duplicate.
                            </p>
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
                                setShowAddSubject(null)
                                setNewSubjectName('')
                              }}
                              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Subjects List */}
                    <div className="space-y-3">
                      {(schoolSubjectsBySchool[school.id] || []).length === 0 ? (
                        <p className="text-gray-500 italic">No subjects yet. Add a subject to this school.</p>
                      ) : (
                        (schoolSubjectsBySchool[school.id] || [])
                          .filter(subject => subjectMatchesSearch(subject, school.id))
                          .map((subject) => {
                          const subjectGroups = getSchoolSubjectGroups(school.id, subject.id)

                          return (
                            <div key={subject.id} className="rounded-md border border-gray-200/60 bg-white/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 dark:border-gray-700/60 dark:bg-gray-800/50">
                              {/* Subject Header */}
                              <div
                                className="p-3 cursor-pointer hover:bg-gray-50/50 transition-colors rounded-t-md dark:hover:bg-gray-700/50"
                                onClick={() => toggleSubjectCollapse(school.id, subject.id)}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <div className="text-purple-600 dark:text-purple-400">
                                      {collapsedSubjects[`${school.id}-${subject.id}`] ? (
                                        <ChevronRight size={20} />
                                      ) : (
                                        <ChevronDown size={20} />
                                      )}
                                    </div>
                                    <BookOpen size={18} className="text-purple-600 dark:text-purple-400" />
                                    <div>
                                      {editingSchool === school.id && editingSubject === subject.id ? (
                                        <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                                          <input
                                            type="text"
                                            value={editSubjectName}
                                            onChange={(e) => setEditSubjectName(e.target.value)}
                                            className="font-medium bg-transparent border-b border-purple-500 focus:outline-none text-gray-900 dark:text-gray-100"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleUpdateSubject(subject.id, editSubjectName)
                                              if (e.key === 'Escape') {
                                                setEditingSubject(null)
                                                setEditSubjectName('')
                                              }
                                            }}
                                            autoFocus
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleUpdateSubject(subject.id, editSubjectName)}
                                            className="text-green-600 hover:text-green-700"
                                          >
                                            <Check size={16} />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              setEditingSubject(null)
                                              setEditSubjectName('')
                                            }}
                                            className="text-gray-600 hover:text-gray-700"
                                          >
                                            <X size={16} />
                                          </Button>
                                        </div>
                                      ) : editingSchool === school.id ? (
                                        <div className="flex gap-2 items-center">
                                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{subject.name}</h4>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setEditingSubject(subject.id)
                                              setEditSubjectName(subject.name)
                                            }}
                                            className="text-purple-600 hover:text-purple-700"
                                          >
                                            <Edit2 size={14} />
                                          </Button>
                                        </div>
                                      ) : (
                                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{subject.name}</h4>
                                      )}
                                      <Badge variant="secondary" className="mt-1">
                                        <Users size={10} className="text-orange-600 dark:text-orange-400" />
                                        {subjectGroups.length} groups
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setShowAddGroup({ schoolId: school.id, subjectId: subject.id })}
                                    >
                                      <Plus size={12} />
                                      Add Group
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Subject Content - Groups */}
                              {!collapsedSubjects[`${school.id}-${subject.id}`] && (
                                <div className="px-4 pb-4">
                                  {/* Add Group Form */}
                                  {showAddGroup?.schoolId === school.id && showAddGroup?.subjectId === subject.id && (
                                    <div className="mb-3 bg-white dark:bg-gray-800 p-3 rounded">
                                      <form onSubmit={(e) => handleAddGroup(e, school.id, subject.id)} className="space-y-3">
                                        <div>
                                          <label className="block text-sm font-medium mb-1">Group Name</label>
                                          <input
                                            type="text"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            placeholder="Enter group name"
                                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                                            required
                                            autoFocus
                                          />
                                        </div>
                                        <div>
                                          <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-medium">Timeslots (optional)</label>
                                            <button
                                              type="button"
                                              onClick={addTimeslot}
                                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                                            >
                                              Add Timeslot
                                            </button>
                                          </div>
                                          {newGroupTimeslots.length === 0 ? (
                                            <p className="text-gray-500 text-xs italic">No timeslots added</p>
                                          ) : (
                                            <div className="space-y-1">
                                              {newGroupTimeslots.map((slot, index) => (
                                                <div key={index} className="grid grid-cols-4 gap-1 items-center">
                                                  <select
                                                    value={slot.day}
                                                    onChange={(e) => updateTimeslot(index, 'day', e.target.value)}
                                                    className="px-2 py-1 border border-gray-300 rounded text-xs"
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
                                                    className="px-2 py-1 border border-gray-300 rounded text-xs"
                                                  />
                                                  <input
                                                    type="time"
                                                    value={slot.endTime}
                                                    onChange={(e) => updateTimeslot(index, 'endTime', e.target.value)}
                                                    className="px-2 py-1 border border-gray-300 rounded text-xs"
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
                                            className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 flex items-center gap-1"
                                          >
                                            <Plus size={14} />
                                            Add Group
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setShowAddGroup(null)
                                              setNewGroupName('')
                                              setNewGroupTimeslots([])
                                            }}
                                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-400"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </form>
                                    </div>
                                  )}

                                  {/* Groups List */}
                                  <div className="space-y-2">
                                    {subjectGroups.length === 0 ? (
                                      <p className="text-gray-500 text-sm italic">No groups yet</p>
                                    ) : (
                                      subjectGroups.filter(groupMatchesSearch).map((group) => (
                                        <div key={group.id} className="bg-gray-50 p-2.5 rounded-md border border-gray-300/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 dark:bg-gray-700/50 dark:border-gray-600/40">
                                          <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                              <div className="flex items-start gap-2">
                                                <div className="text-orange-600 dark:text-orange-400 mt-0.5">
                                                  <Users size={16} />
                                                </div>
                                                <div>
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
                                              </div>
                                            </div>
                                            <div className="flex gap-1">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setShowAddStudent(group.id)}
                                              >
                                                <Plus size={12} />
                                                Add Student
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteGroup(group.id, school.id, subject.id)}
                                              >
                                                <Trash2 size={12} />
                                              </Button>
                                            </div>
                                          </div>

                                          {/* Add Student Form */}
                                          {showAddStudent === group.id && (
                                            <div className="mb-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                              <form onSubmit={(e) => handleAddStudent(e, group.id)}>
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
                                          {rostersByGroup[group.id] && rostersByGroup[group.id].length > 0 && (
                                            <div className="mt-2">
                                              <div
                                                className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 p-1 rounded"
                                                onClick={() => toggleGroupCollapse(group.id)}
                                              >
                                                <div className="text-orange-600 dark:text-orange-400">
                                                  {collapsedGroups[group.id] ? (
                                                    <ChevronRight size={16} />
                                                  ) : (
                                                    <ChevronDown size={16} />
                                                  )}
                                                </div>
                                                <Users size={16} className="text-orange-600 dark:text-orange-400" />
                                                <h6 className="text-xs font-medium">Students ({rostersByGroup[group.id].length})</h6>
                                              </div>
                                              {!collapsedGroups[group.id] && (
                                                <div className="space-y-1 mt-1">
                                                  {rostersByGroup[group.id].map((student) => (
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
                                                              if (e.key === 'Enter') handleUpdateStudent(student.id, editStudentName, group.id)
                                                              if (e.key === 'Escape') {
                                                                setEditingStudent(null)
                                                                setEditStudentName('')
                                                              }
                                                            }}
                                                            autoFocus
                                                          />
                                                          <button
                                                            onClick={() => handleUpdateStudent(student.id, editStudentName, group.id)}
                                                            className="text-green-600 hover:text-green-800"
                                                          >
                                                            <Check size={16} />
                                                          </button>
                                                          <button
                                                            onClick={() => {
                                                              setEditingStudent(null)
                                                              setEditStudentName('')
                                                            }}
                                                            className="text-gray-600 hover:text-gray-800"
                                                          >
                                                            <X size={16} />
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
                                                              <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                              onClick={() => handleDeleteStudent(student.id, group.id)}
                                                              className="text-red-600 hover:text-red-800"
                                                            >
                                                              <Trash2 size={14} />
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
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Group Overview Modal - M9 */}
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
            roster={rostersByGroup[selectedGroup.id] || []}
            onClose={closeGroupOverview}
            onGroupUpdate={handleGroupUpdate}
            onRosterUpdate={handleRosterUpdate}
            onGroupDelete={handleGroupDeleteFromModal}
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
            These are your subjects. They work like tags - create groups and assign them to subjects.
          </p>

          <div className="space-y-2">
            {allSubjects.length === 0 ? (
              <p className="text-gray-500 italic">No subjects yet. Add a subject when creating a group.</p>
            ) : (
              allSubjects.map((subject) => (
                <div key={subject.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  {editingSubject === subject.id ? (
                    <div className="flex gap-2 items-center flex-1">
                      <input
                        type="text"
                        value={editSubjectName}
                        onChange={(e) => setEditSubjectName(e.target.value)}
                        className="flex-1 font-medium bg-transparent border-b border-blue-500 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateSubject(subject.id, editSubjectName)
                          if (e.key === 'Escape') {
                            setEditingSubject(null)
                            setEditSubjectName('')
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateSubject(subject.id, editSubjectName)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingSubject(null)
                          setEditSubjectName('')
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className="font-medium">
                          {subject.name}
                          <span className="text-sm text-gray-500 ml-2">
                            ({groupsBySubject[subject.id]?.length || 0} groups)
                          </span>
                        </span>
                        {(() => {
                          // Find which schools use this subject (via groups)
                          const subjectGroups = groupsBySubject[subject.id] || []
                          const schoolsUsingSubject = schools.filter(school =>
                            subjectGroups.some(group => group.school_id === school.id)
                          )

                          if (schoolsUsingSubject.length > 0) {
                            return (
                              <div className="text-xs text-gray-500 mt-1">
                                📁 {schoolsUsingSubject.map(s => s.name).join(', ')}
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingSubject(subject.id)
                            setEditSubjectName(subject.name)
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Edit2 size={16} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(subject.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
      </div>
    </div>
  )
}
