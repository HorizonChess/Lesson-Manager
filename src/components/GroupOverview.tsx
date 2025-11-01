import { useState, useEffect } from 'react'
import type { Group, School, Subject, RosterItem, Lesson, LessonRecord } from '../types/database'
import { addRosterStudent, updateRosterStudent, deleteRosterStudent } from '../services/roster'
import { updateGroup, deleteGroupById } from '../services/groups'
import { ensureLessonRecord, updateLessonRecord } from '../services/lessonRecords'
import { updateLessonCancellation, deleteLessonById } from '../services/lessons'
import {
  fetchGroupAttendance,
  fetchGroupLessons,
  fetchAttendanceForRecord,
  updateAttendanceRecord,
  createAttendanceRecord,
  type AttendanceWithStudent
} from '../services/groups.view'
import { Button } from '../components/ui/button'

interface GroupOverviewProps {
  group: Group
  school: School
  subject: Subject
  roster: RosterItem[]
  onClose: () => void
  onGroupUpdate?: (updatedGroup: Group) => void
  onRosterUpdate?: (roster: RosterItem[]) => void
  onGroupDelete?: (groupId: string) => void
  activeTab?: TabType
  onTabChange?: (tab: TabType) => void
}

type TabType = 'students' | 'attendance' | 'lessons' | 'settings'

export function GroupOverview({
  group,
  school,
  subject,
  roster,
  onClose,
  onGroupUpdate,
  onRosterUpdate,
  onGroupDelete,
  activeTab = 'students',
  onTabChange
}: GroupOverviewProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabType>(activeTab)

  // Use parent's activeTab if available, otherwise use internal state
  const currentActiveTab = onTabChange ? activeTab : internalActiveTab
  const handleTabChange = onTabChange || setInternalActiveTab

  // Student management states
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [newStudentName, setNewStudentName] = useState('')
  const [editingStudent, setEditingStudent] = useState<string | null>(null)
  const [editStudentName, setEditStudentName] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Group settings states
  const [editingGroup, setEditingGroup] = useState(false)
  const [editGroupName, setEditGroupName] = useState(group.name)
  const [editGroupTimeslots, setEditGroupTimeslots] = useState(group.timeslots || [])

  // Attendance states
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonRecords, setLessonRecords] = useState<Record<string, LessonRecord>>({})
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceWithStudent[]>>({})
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  })

  // Lesson record modal states (reuse existing data from lessons tab)
  const [openLessonRecord, setOpenLessonRecord] = useState<string | null>(null)
  const [recordData, setRecordData] = useState({
    covered: '',
    planned: '',
    homework: '',
    notes: ''
  })

  interface Timeslot {
    day: string
    startTime: string
    endTime: string
  }

  // Fetch data when relevant tabs are active
  useEffect(() => {
    if (currentActiveTab === 'attendance') {
      fetchAttendanceData()
    } else if (currentActiveTab === 'lessons') {
      fetchLessonsData()
    }
  }, [currentActiveTab, dateFilter, group.id])

  const fetchAttendanceData = async () => {
    try {
      setAttendanceLoading(true)

      const startIso = `${dateFilter.start}T00:00:00.000Z`
      const endIso = `${dateFilter.end}T23:59:59.999Z`
      const { lessons: lessonsData, lessonRecords, attendanceByRecord } = await fetchGroupAttendance(group.id, startIso, endIso)

      setLessons(lessonsData)
      setLessonRecords(lessonRecords)
      setAttendanceData(attendanceByRecord)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAttendanceLoading(false)
    }
  }

  const fetchLessonsData = async () => {
    try {
      setAttendanceLoading(true)

      const { lessons: lessonsData, lessonRecords } = await fetchGroupLessons(group.id)
      setLessons(lessonsData)
      setLessonRecords(lessonRecords)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAttendanceLoading(false)
    }
  }

  // Student CRUD operations
  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStudentName.trim()) return

    try {
      setError(null)
      const newStudent = await addRosterStudent(group.id, newStudentName)
      const updatedRoster = [...roster, newStudent]
      onRosterUpdate?.(updatedRoster)
      setNewStudentName('')
      setShowAddStudent(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateStudent = async (studentId: string, newName: string) => {
    if (!newName.trim()) return

    try {
      setError(null)
      const updatedStudent = await updateRosterStudent(studentId, newName)
      const updatedRoster = roster.map(s => s.id === studentId ? updatedStudent : s)
      onRosterUpdate?.(updatedRoster)
      setEditingStudent(null)
      setEditStudentName('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the group?')) return

    try {
      setError(null)
      await deleteRosterStudent(studentId)
      const updatedRoster = roster.filter(s => s.id !== studentId)
      onRosterUpdate?.(updatedRoster)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Group settings functions
  const updateGroupSettings = async () => {
    try {
      setError(null)
      const updatedGroup = await updateGroup({
        groupId: group.id,
        name: editGroupName.trim(),
        timeslots: editGroupTimeslots.filter(slot => slot.day && slot.startTime && slot.endTime)
      })
      onGroupUpdate?.(updatedGroup)
      setEditingGroup(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteGroup = async () => {
    if (!confirm(`Are you sure you want to delete the group "${group.name}"? This will also delete all its lessons and related data.`)) return

    try {
      setError(null)
      await deleteGroupById(group.id)
      onGroupDelete?.(group.id)
      onClose()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Timeslot helpers
  const addTimeslot = () => {
    setEditGroupTimeslots([...editGroupTimeslots, { day: '', startTime: '', endTime: '' }])
  }

  const updateTimeslot = (index: number, field: keyof Timeslot, value: string) => {
    const updated = editGroupTimeslots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    )
    setEditGroupTimeslots(updated)
  }

  const removeTimeslot = (index: number) => {
    setEditGroupTimeslots(editGroupTimeslots.filter((_, i) => i !== index))
  }

  // Lesson record functions
  const openLessonRecordForm = async (lessonId: string) => {
    try {
      setError(null)

      let record = lessonRecords[lessonId]

      if (!record) {
        record = await ensureLessonRecord(lessonId)
        setLessonRecords({
          ...lessonRecords,
          [lessonId]: record
        })
      }

      setRecordData({
        covered: record.covered || '',
        planned: record.planned || '',
        homework: record.homework || '',
        notes: record.notes || ''
      })

      if (record.id && !attendanceData[record.id]) {
        const attendanceRecords = await fetchAttendanceForRecord(record.id)
        setAttendanceData({
          ...attendanceData,
          [record.id]: attendanceRecords
        })
      }

      setOpenLessonRecord(lessonId)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const saveLessonRecord = async () => {
    if (!openLessonRecord) return

    try {
      setError(null)
      const updatedRecord = await updateLessonRecord(openLessonRecord, {
        covered: recordData.covered,
        planned: recordData.planned,
        homework: recordData.homework,
        notes: recordData.notes
      })

      setLessonRecords({
        ...lessonRecords,
        [openLessonRecord]: updatedRecord
      })

      setOpenLessonRecord(null)
      setRecordData({ covered: '', planned: '', homework: '', notes: '' })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateStudentAttendance = async (
    studentId: string,
    status: 'present' | 'absent' | 'late',
    note?: string
  ) => {
    if (!openLessonRecord) return

    const currentRecord = lessonRecords[openLessonRecord]
    if (!currentRecord) return

    try {
      setError(null)
      const currentAttendanceArray = attendanceData[currentRecord.id] || []
      const existingAttendance = currentAttendanceArray.find(a => a.roster_item_id === studentId)

      if (existingAttendance) {
        const updated = await updateAttendanceRecord(existingAttendance.id, status, note)
        const updatedAttendanceArray = currentAttendanceArray.map(a =>
          a.roster_item_id === studentId
            ? { ...updated, student_name: updated.student_name ?? existingAttendance.student_name }
            : a
        )
        setAttendanceData({
          ...attendanceData,
          [currentRecord.id]: updatedAttendanceArray
        })
      } else {
        const created = await createAttendanceRecord(currentRecord.id, studentId, status, note)
        const student = roster.find(s => s.id === studentId)
        const newAttendanceRecord = {
          ...created,
          student_name: created.student_name ?? student?.student_name
        }
        setAttendanceData({
          ...attendanceData,
          [currentRecord.id]: [...currentAttendanceArray, newAttendanceRecord]
        })
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Lesson management functions
  const toggleLessonCancellation = async (lessonId: string, currentStatus: boolean) => {
    try {
      setError(null)
      const updatedLesson = await updateLessonCancellation(lessonId, !currentStatus)
      setLessons(lessons.map(lesson =>
        lesson.id === lessonId ? updatedLesson : lesson
      ))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return

    try {
      setError(null)
      await deleteLessonById(lessonId)
      setLessons(lessons.filter(lesson => lesson.id !== lessonId))
      const newRecords = { ...lessonRecords }
      delete newRecords[lessonId]
      setLessonRecords(newRecords)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'attendance', label: 'Attendance', icon: '✓' },
    { id: 'lessons', label: 'Lessons', icon: '📚' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  const renderTabContent = () => {
    switch (currentActiveTab) {
      case 'students':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Students in {group.name}</h3>
              <Button
                onClick={() => setShowAddStudent(true)}
                variant="default"
              >
                Add Student
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Add Student Form */}
            {showAddStudent && (
              <div className="mb-4 surface-section-muted p-4 rounded-lg">
                <form onSubmit={addStudent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Student Name</label>
                    <input
                      type="text"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="Enter student name"
                      className="surface-input w-full px-3 py-2"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="default"
                    >
                      Add Student
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowAddStudent(false)
                        setNewStudentName('')
                      }}
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Students List */}
            {roster.length > 0 ? (
              <div className="space-y-2">
                {roster.map((student) => (
                  <div
                    key={student.id}
                    className="flex justify-between items-center surface-section-muted p-3 rounded"
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
                              updateStudent(student.id, editStudentName)
                            } else if (e.key === 'Escape') {
                              setEditingStudent(null)
                              setEditStudentName('')
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          onClick={() => updateStudent(student.id, editStudentName)}
                          variant="ghost"
                          size="sm"
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                        >
                          ✓
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingStudent(null)
                            setEditStudentName('')
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-soft hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium">{student.student_name}</span>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setEditingStudent(student.id)
                              setEditStudentName(student.student_name)
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => deleteStudent(student.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            Remove
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-soft-muted">
                <p className="text-lg">No students in this group yet</p>
                <p className="text-sm">Click "Add Student" to get started</p>
              </div>
            )}
          </div>
        )

      case 'attendance':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Attendance History</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">From:</label>
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                    className="surface-input px-3 py-1 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">To:</label>
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                    className="surface-input px-3 py-1 text-sm"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {attendanceLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12 text-soft-muted">
                <p className="text-lg">No lessons found in the selected date range</p>
                <p className="text-sm mt-2">Try adjusting the date filter or check the Lessons page to create lessons for this group</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Attendance Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(() => {
                    const totalLessons = lessons.filter(l => !l.is_cancelled && lessonRecords[l.id]).length
                    const lessonsWithAttendance = Object.keys(attendanceData).length
                    const allAttendanceRecords = Object.values(attendanceData).flat()
                    const presentCount = allAttendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length
                    const totalAttendanceRecords = allAttendanceRecords.length
                    const averageAttendance = totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0

                    return (
                      <>
                        <div className="surface-section-muted p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalLessons}</div>
                          <div className="text-sm text-slate-800 dark:text-slate-200">Total Lessons</div>
                        </div>
                        <div className="surface-section-muted p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{lessonsWithAttendance}</div>
                          <div className="text-sm text-slate-800 dark:text-slate-200">With Attendance</div>
                        </div>
                        <div className="surface-section-muted p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{averageAttendance}%</div>
                          <div className="text-sm text-slate-800 dark:text-slate-200">Average Attendance</div>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* Lessons with Attendance */}
                <div className="space-y-4">
                  {lessons
                    .filter(lesson => lessonRecords[lesson.id]) // Only show lessons with records
                    .map(lesson => {
                      const record = lessonRecords[lesson.id]
                      const attendance = attendanceData[record.id] || []
                      const lessonDate = new Date(lesson.start_time)
                      const presentStudents = attendance.filter(a => a.status === 'present' || a.status === 'late')
                      const attendancePercentage = attendance.length > 0 ? Math.round((presentStudents.length / attendance.length) * 100) : 0

                      return (
                        <div key={lesson.id} className="surface-body p-4">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <h4 className="font-medium">
                                {lessonDate.toLocaleDateString('en-GB')} - {lessonDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </h4>
                              <div className="text-sm text-soft-muted">
                                {presentStudents.length}/{attendance.length} present ({attendancePercentage}%)
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded text-sm font-medium ${
                              attendancePercentage >= 80 ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' :
                              attendancePercentage >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200' :
                              'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                            }`}>
                              {attendancePercentage}%
                            </div>
                          </div>

                          {attendance.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {attendance.map(record => (
                                <div key={record.id} className="flex items-center justify-between surface-section-muted p-2 rounded">
                                  <span className="text-sm font-medium">{record.student_name}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    record.status === 'present' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' :
                                    record.status === 'late' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200' :
                                    'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                                  }`}>
                                    {record.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {attendance.length === 0 && (
                            <div className="text-center py-4 text-soft-muted italic">
                              No attendance data recorded for this lesson
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>

                {lessons.filter(l => lessonRecords[l.id]).length === 0 && (
                  <div className="text-center py-8 text-soft-muted">
                    <p className="text-lg">No attendance data available</p>
                    <p className="text-sm mt-2">Attendance is recorded when you view lesson records. Visit the Lessons page to start recording attendance.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 'lessons':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Lessons for {group.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-soft-muted">
                  Total: {lessons.length} | Active: {lessons.filter(l => !l.is_cancelled).length}
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {attendanceLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12 text-soft-muted">
                <p className="text-lg">No lessons scheduled for this group</p>
                <p className="text-sm mt-2">Go to the Lessons page to create lessons or generate recurring lessons for this group</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Upcoming Lessons Section */}
                {(() => {
                  const now = new Date()
                  const upcomingLessons = lessons
                    .filter(lesson => new Date(lesson.start_time) >= now && !lesson.is_cancelled)
                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()) // Sort chronologically (earliest first)
                    .slice(0, 5) // Show next 5 upcoming lessons

                  return upcomingLessons.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium mb-3 text-green-600 dark:text-green-400">Upcoming Lessons</h4>
                      <div className="space-y-2">
                        {upcomingLessons.map(lesson => {
                          const lessonDate = new Date(lesson.start_time)
                          const endDate = new Date(lesson.end_time)
                          const hasRecord = lessonRecords[lesson.id]

                          return (
                            <div key={lesson.id} className="surface-body p-3 rounded-lg border-l-4 border-l-green-500">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">
                                    {lessonDate.toLocaleDateString('en-GB')} - {lessonDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="text-sm text-slate-700 dark:text-slate-300">
                                    {hasRecord ? '✅ Has lesson record' : '⚠️ No lesson record yet'}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    onClick={() => openLessonRecordForm(lesson.id)}
                                    variant="default"
                                    size="sm"
                                  >
                                    View
                                  </Button>
                                  <Button
                                    onClick={() => toggleLessonCancellation(lesson.id, lesson.is_cancelled)}
                                    variant="outline"
                                    size="sm"
                                    className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => deleteLesson(lesson.id)}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* Past Lessons Section */}
                {(() => {
                  const now = new Date()
                  const pastLessons = lessons
                    .filter(lesson => new Date(lesson.start_time) < now)
                    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()) // Sort by most recent first
                    .slice(0, 10) // Show last 10 past lessons

                  return pastLessons.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium mb-3 text-blue-600 dark:text-blue-400">Recent Lessons</h4>
                      <div className="space-y-2">
                        {pastLessons.map(lesson => {
                          const lessonDate = new Date(lesson.start_time)
                          const endDate = new Date(lesson.end_time)
                          const hasRecord = lessonRecords[lesson.id]
                          const record = lessonRecords[lesson.id]

                          return (
                            <div
                              key={lesson.id}
                              className={`surface-body p-3 rounded-lg ${
                                lesson.is_cancelled
                                  ? 'border-l-4 border-l-red-500 opacity-75'
                                  : 'border-l-4 border-l-blue-500'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className={`font-medium ${lesson.is_cancelled ? 'line-through' : ''}`}>
                                    {lessonDate.toLocaleDateString('en-GB')} - {lessonDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {lesson.is_cancelled && <span className="ml-2 text-red-600 dark:text-red-400 text-sm">(Cancelled)</span>}
                                  </div>

                                  {hasRecord && record && (
                                    <div className="mt-2 space-y-1 text-sm">
                                      {record.covered && (
                                        <div>
                                          <span className="font-medium text-soft">Covered:</span>
                                          <span className="ml-2 text-soft">{record.covered.substring(0, 100)}{record.covered.length > 100 ? '...' : ''}</span>
                                        </div>
                                      )}
                                      {record.planned && (
                                        <div>
                                          <span className="font-medium text-soft">Planned Next:</span>
                                          <span className="ml-2 text-soft">{record.planned.substring(0, 100)}{record.planned.length > 100 ? '...' : ''}</span>
                                        </div>
                                      )}
                                      {record.homework && (
                                        <div>
                                          <span className="font-medium text-soft">Homework:</span>
                                          <span className="ml-2 text-soft">{record.homework.substring(0, 100)}{record.homework.length > 100 ? '...' : ''}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {!hasRecord && !lesson.is_cancelled && (
                                    <div className="mt-1 text-sm text-soft-muted italic">
                                      No lesson record - Go to Lessons page to add record and attendance
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-1 ml-4">
                                  <Button
                                    onClick={() => openLessonRecordForm(lesson.id)}
                                    variant="default"
                                    size="sm"
                                  >
                                    View
                                  </Button>
                                  {!lesson.is_cancelled ? (
                                    <>
                                      <Button
                                        onClick={() => toggleLessonCancellation(lesson.id, lesson.is_cancelled)}
                                        variant="outline"
                                        size="sm"
                                        className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={() => deleteLesson(lesson.id)}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        onClick={() => toggleLessonCancellation(lesson.id, lesson.is_cancelled)}
                                        variant="outline"
                                        size="sm"
                                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                      >
                                        Restore
                                      </Button>
                                      <Button
                                        onClick={() => deleteLesson(lesson.id)}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* Quick Actions */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium mb-3">Quick Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        // Link to lessons page - could be enhanced to navigate programmatically
                        window.location.href = '/lessons'
                      }}
                      variant="default"
                    >
                      📚 Go to Lessons Page
                    </Button>
                    <div className="text-sm text-soft-muted px-4 py-2">
                      Create new lessons, lesson records, and manage attendance from the Lessons page
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'settings':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Group Settings</h3>
              <div className="flex gap-2">
                {!editingGroup ? (
                  <>
                    <Button
                      onClick={() => setEditingGroup(true)}
                      variant="default"
                    >
                      Edit Settings
                    </Button>
                    <Button
                      onClick={deleteGroup}
                      variant="outline"
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      Delete Group
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={updateGroupSettings}
                      variant="default"
                    >
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingGroup(false)
                        setEditGroupName(group.name)
                        setEditGroupTimeslots(group.timeslots || [])
                      }}
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-soft mb-2">
                  Group Name
                </label>
                {editingGroup ? (
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    className="surface-input w-full px-3 py-2"
                  />
                ) : (
                  <div className="text-soft font-medium">{group.name}</div>
                )}
              </div>

              {/* School & Subject (Read-only) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-soft mb-2">
                    School
                  </label>
                  <div className="text-soft surface-section-muted p-2 rounded">
                    {school.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-soft mb-2">
                    Subject
                  </label>
                  <div className="text-soft surface-section-muted p-2 rounded">
                    {subject.name}
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-soft">
                    Schedule
                  </label>
                  {editingGroup && (
                    <Button
                      onClick={addTimeslot}
                      variant="outline"
                      size="sm"
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                    >
                      Add Timeslot
                    </Button>
                  )}
                </div>

                {editingGroup ? (
                  <div className="space-y-2">
                    {editGroupTimeslots.length === 0 ? (
                      <p className="text-soft-muted text-sm italic">No timeslots added yet</p>
                    ) : (
                      editGroupTimeslots.map((slot, index) => (
                        <div key={index} className="grid grid-cols-4 gap-2 items-center">
                          <select
                            value={slot.day}
                            onChange={(e) => updateTimeslot(index, 'day', e.target.value)}
                            className="surface-input px-3 py-2"
                          >
                            <option value="">Select Day</option>
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
                            className="surface-input px-3 py-2"
                          />
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateTimeslot(index, 'endTime', e.target.value)}
                            className="surface-input px-3 py-2"
                          />
                          <Button
                            onClick={() => removeTimeslot(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {group.timeslots && group.timeslots.length > 0 ? (
                      group.timeslots.map((slot: any, index: number) => (
                        <div key={index} className="text-sm surface-section-muted p-3 rounded">
                          <strong>{slot.day}</strong> {slot.startTime} - {slot.endTime}
                        </div>
                      ))
                    ) : (
                      <div className="text-soft-muted text-sm italic surface-section-muted p-3 rounded">
                        No schedule set
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Group Statistics */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium mb-2">Group Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-soft-muted">Students:</span>
                    <span className="ml-2 font-medium">{roster.length}</span>
                  </div>
                  <div>
                    <span className="text-soft-muted">Weekly Hours:</span>
                    <span className="ml-2 font-medium">
                      {group.timeslots ?
                        group.timeslots.reduce((total: number, slot: any) => {
                          if (slot.startTime && slot.endTime) {
                            const start = new Date(`1970-01-01T${slot.startTime}:00`)
                            const end = new Date(`1970-01-01T${slot.endTime}:00`)
                            return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                          }
                          return total
                        }, 0).toFixed(1)
                        : '0'
                      } hours
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border-white/20 dark:border-white/10">
        <nav className="flex space-x-8 px-6" aria-label="Group tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                currentActiveTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-soft-muted hover:text-soft hover:border-white/40 dark:text-slate-300 dark:hover:text-slate-100'
              }`}
              aria-selected={currentActiveTab === tab.id}
              role="tab"
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto" role="tabpanel">
        {renderTabContent()}
      </div>

      {/* Lesson Record Modal */}
      {openLessonRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="surface-modal w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="surface-toolbar flex justify-between items-center rounded-none border-b border-white/12 px-6 py-5">
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {(() => {
                    const lesson = lessons.find(l => l.id === openLessonRecord)
                    if (!lesson) return 'Lesson Record'
                    const lessonDate = new Date(lesson.start_time)
                    return `${group.name} - ${lessonDate.toLocaleDateString('en-GB')} Lesson Record`
                  })()}
                </h2>
              </div>
              <Button
                onClick={() => {
                  setOpenLessonRecord(null)
                  setRecordData({ covered: '', planned: '', homework: '', notes: '' })
                  setAttendanceData({})
                }}
                variant="ghost"
                className="text-xl min-w-[44px] min-h-[44px]"
              >
                ×
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">What was covered today?</label>
                  <textarea
                    value={recordData.covered}
                    onChange={(e) => setRecordData({ ...recordData, covered: e.target.value })}
                    placeholder="Topics covered, activities completed, progress made..."
                    className="surface-input w-full px-3 py-2 h-20 resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Planned for next lesson</label>
                  <textarea
                    value={recordData.planned}
                    onChange={(e) => setRecordData({ ...recordData, planned: e.target.value })}
                    placeholder="Topics to cover, activities to do, goals for next lesson..."
                    className="surface-input w-full px-3 py-2 h-20 resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Homework assigned</label>
                  <textarea
                    value={recordData.homework}
                    onChange={(e) => setRecordData({ ...recordData, homework: e.target.value })}
                    placeholder="Homework assignments, practice exercises, reading..."
                    className="surface-input w-full px-3 py-2 h-16 resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={recordData.notes}
                    onChange={(e) => setRecordData({ ...recordData, notes: e.target.value })}
                    placeholder="Additional notes, student behavior, important observations..."
                    className="surface-input w-full px-3 py-2 h-16 resize-none text-sm"
                  />
                </div>

                {/* Attendance Section */}
                {roster.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Attendance</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {roster.map((student) => {
                        const currentRecord = lessonRecords[openLessonRecord]
                        const currentAttendanceArray = currentRecord ? attendanceData[currentRecord.id] || [] : []
                        const studentAttendance = currentAttendanceArray.find(a => a.roster_item_id === student.id)
                        const attendanceStatus = studentAttendance?.status || 'present'

                        return (
                          <div key={student.id} className="p-2 surface-section-muted rounded">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-1 font-medium text-sm">
                                {student.student_name}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => updateStudentAttendance(student.id, 'present')}
                                  variant={attendanceStatus === 'present' ? 'default' : 'outline'}
                                  size="sm"
                                  className={`min-w-[60px] ${
                                    attendanceStatus === 'present'
                                      ? 'bg-green-600 hover:bg-green-700 text-white'
                                      : 'hover:bg-green-100 dark:hover:bg-green-900'
                                  }`}
                                >
                                  Present
                                </Button>
                                <Button
                                  onClick={() => updateStudentAttendance(student.id, 'absent')}
                                  variant={attendanceStatus === 'absent' ? 'default' : 'outline'}
                                  size="sm"
                                  className={`min-w-[60px] ${
                                    attendanceStatus === 'absent'
                                      ? 'bg-red-600 hover:bg-red-700 text-white'
                                      : 'hover:bg-red-100 dark:hover:bg-red-900'
                                  }`}
                                >
                                  Absent
                                </Button>
                                <Button
                                  onClick={() => updateStudentAttendance(student.id, 'late')}
                                  variant={attendanceStatus === 'late' ? 'default' : 'outline'}
                                  size="sm"
                                  className={`min-w-[60px] ${
                                    attendanceStatus === 'late'
                                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                      : 'hover:bg-yellow-100 dark:hover:bg-yellow-900'
                                  }`}
                                >
                                  Late
                                </Button>
                              </div>
                            </div>

                            {studentAttendance?.note && (
                              <div className="surface-section-muted text-xs text-soft italic p-1">
                                {studentAttendance.note}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Attendance Summary */}
                    {(() => {
                      const currentRecord = lessonRecords[openLessonRecord]
                      const currentAttendanceArray = currentRecord ? attendanceData[currentRecord.id] || [] : []
                      return currentAttendanceArray.length > 0 && (
                        <div className="mt-3 text-sm text-soft">
                          Present: {currentAttendanceArray.filter(a => a.status === 'present').length} •
                          Absent: {currentAttendanceArray.filter(a => a.status === 'absent').length} •
                          Late: {currentAttendanceArray.filter(a => a.status === 'late').length}
                          {roster.length > 0 && (
                            <span className="ml-2 font-medium">
                              ({Math.round((currentAttendanceArray.filter(a => a.status === 'present' || a.status === 'late').length / roster.length) * 100)}% attended)
                            </span>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4">
              <div className="flex gap-3">
                <Button
                  onClick={saveLessonRecord}
                  variant="default"
                  className="flex-1 font-medium min-h-[44px]"
                >
                  Save Record
                </Button>
                <Button
                  onClick={() => {
                    setOpenLessonRecord(null)
                    setRecordData({ covered: '', planned: '', homework: '', notes: '' })
                  }}
                  variant="ghost"
                  className="min-h-[44px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
