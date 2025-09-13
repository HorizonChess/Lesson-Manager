import { useState, useEffect } from 'react'
import type { Group, School, Subject, RosterItem, Lesson, LessonRecord, Attendance } from '../types/database'
import { supabase } from '../lib/supabase'

// Extended Attendance type with student name
interface AttendanceWithStudent extends Attendance {
  student_name?: string
}

interface GroupOverviewProps {
  group: Group
  school: School
  subject: Subject
  roster: RosterItem[]
  onClose: () => void
  onGroupUpdate?: (updatedGroup: Group) => void
  onRosterUpdate?: (roster: RosterItem[]) => void
  onGroupDelete?: (groupId: string) => void
}

type TabType = 'students' | 'attendance' | 'lessons' | 'settings'

export function GroupOverview({ group, school, subject, roster, onClose, onGroupUpdate, onRosterUpdate, onGroupDelete }: GroupOverviewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('students')

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

  interface Timeslot {
    day: string
    startTime: string
    endTime: string
  }

  // Fetch data when relevant tabs are active
  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceData()
    } else if (activeTab === 'lessons') {
      fetchLessonsData()
    }
  }, [activeTab, dateFilter, group.id])

  const fetchAttendanceData = async () => {
    try {
      setAttendanceLoading(true)

      // Fetch lessons for this group within date range
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('group_id', group.id)
        .gte('start_time', `${dateFilter.start}T00:00:00.000Z`)
        .lte('start_time', `${dateFilter.end}T23:59:59.999Z`)
        .order('start_time', { ascending: false })

      if (lessonsError) throw lessonsError

      setLessons(lessonsData || [])

      // Fetch lesson records for these lessons
      if (lessonsData && lessonsData.length > 0) {
        const { data: recordsData, error: recordsError } = await supabase
          .from('lesson_records')
          .select('*')
          .in('lesson_id', lessonsData.map(l => l.id))

        if (recordsError) throw recordsError

        const recordsByLesson = (recordsData || []).reduce((acc, record) => {
          acc[record.lesson_id] = record
          return acc
        }, {} as Record<string, LessonRecord>)

        setLessonRecords(recordsByLesson)

        // Fetch attendance data for these lesson records
        if (recordsData && recordsData.length > 0) {
          const { data: attendanceRecords, error: attendanceError } = await supabase
            .from('attendance')
            .select(`
              *,
              roster_item:roster_items(student_name)
            `)
            .in('lesson_record_id', recordsData.map(r => r.id))

          if (attendanceError) throw attendanceError

          // Group attendance by lesson record id
          const attendanceByRecord: Record<string, AttendanceWithStudent[]> = {}
          attendanceRecords?.forEach((attendance: any) => {
            if (!attendanceByRecord[attendance.lesson_record_id]) {
              attendanceByRecord[attendance.lesson_record_id] = []
            }
            attendanceByRecord[attendance.lesson_record_id].push({
              ...attendance,
              student_name: attendance.roster_item?.student_name
            })
          })

          setAttendanceData(attendanceByRecord)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAttendanceLoading(false)
    }
  }

  const fetchLessonsData = async () => {
    try {
      setAttendanceLoading(true) // Reuse the loading state for lessons

      // Fetch lessons for this group
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('group_id', group.id)
        .order('start_time', { ascending: false })

      if (lessonsError) throw lessonsError

      setLessons(lessonsData || [])

      // Fetch lesson records for these lessons
      if (lessonsData && lessonsData.length > 0) {
        const { data: recordsData, error: recordsError } = await supabase
          .from('lesson_records')
          .select('*')
          .in('lesson_id', lessonsData.map(l => l.id))

        if (recordsError) throw recordsError

        const recordsByLesson = (recordsData || []).reduce((acc, record) => {
          acc[record.lesson_id] = record
          return acc
        }, {} as Record<string, LessonRecord>)

        setLessonRecords(recordsByLesson)
      }
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
      const { data, error } = await supabase
        .from('roster_items')
        .insert({
          group_id: group.id,
          student_name: newStudentName.trim(),
        })
        .select()
        .single()

      if (error) throw error

      const updatedRoster = [...roster, data]
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
      const { data, error } = await supabase
        .from('roster_items')
        .update({ student_name: newName.trim() })
        .eq('id', studentId)
        .select()
        .single()

      if (error) throw error

      const updatedRoster = roster.map(s => s.id === studentId ? data : s)
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
      const { error } = await supabase
        .from('roster_items')
        .delete()
        .eq('id', studentId)

      if (error) throw error

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
      const { data, error } = await supabase
        .from('groups')
        .update({
          name: editGroupName.trim(),
          timeslots: editGroupTimeslots.filter(slot => slot.day && slot.startTime && slot.endTime)
        })
        .eq('id', group.id)
        .select()
        .single()

      if (error) throw error

      onGroupUpdate?.(data)
      setEditingGroup(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteGroup = async () => {
    if (!confirm(`Are you sure you want to delete the group "${group.name}"? This will also delete all its lessons and related data.`)) return

    try {
      setError(null)
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', group.id)

      if (error) throw error

      onGroupDelete?.(group.id) // Notify parent to update UI
      onClose() // Close modal after successful deletion
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

  // Lesson management functions
  const toggleLessonCancellation = async (lessonId: string, currentStatus: boolean) => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('lessons')
        .update({ is_cancelled: !currentStatus })
        .eq('id', lessonId)
        .select()
        .single()

      if (error) throw error

      setLessons(lessons.map(lesson =>
        lesson.id === lessonId ? data : lesson
      ))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return

    try {
      setError(null)
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

      if (error) throw error

      setLessons(lessons.filter(lesson => lesson.id !== lessonId))
      // Remove lesson record if it exists
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
    switch (activeTab) {
      case 'students':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Students in {group.name}</h3>
              <button
                onClick={() => setShowAddStudent(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                Add Student
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Add Student Form */}
            {showAddStudent && (
              <div className="mb-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <form onSubmit={addStudent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Student Name</label>
                    <input
                      type="text"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="Enter student name"
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
                      Add Student
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddStudent(false)
                        setNewStudentName('')
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
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
                    className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded"
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
                        <button
                          onClick={() => updateStudent(student.id, editStudentName)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingStudent(null)
                            setEditStudentName('')
                          }}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium">{student.student_name}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingStudent(student.id)
                              setEditStudentName(student.student_name)
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteStudent(student.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
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
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">To:</label>
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {attendanceLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
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
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalLessons}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Lessons</div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{lessonsWithAttendance}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">With Attendance</div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{averageAttendance}%</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Average Attendance</div>
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
                        <div key={lesson.id} className="bg-white dark:bg-gray-800 border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <h4 className="font-medium">
                                {lessonDate.toLocaleDateString('en-GB')} - {lessonDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </h4>
                              <div className="text-sm text-gray-500">
                                {presentStudents.length}/{attendance.length} present ({attendancePercentage}%)
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded text-sm font-medium ${
                              attendancePercentage >= 80 ? 'bg-green-100 text-green-800' :
                              attendancePercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {attendancePercentage}%
                            </div>
                          </div>

                          {attendance.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {attendance.map(record => (
                                <div key={record.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                  <span className="text-sm font-medium">{record.student_name}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    record.status === 'present' ? 'bg-green-100 text-green-800' :
                                    record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {record.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {attendance.length === 0 && (
                            <div className="text-center py-4 text-gray-500 italic">
                              No attendance data recorded for this lesson
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>

                {lessons.filter(l => lessonRecords[l.id]).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
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
                <span className="text-sm text-gray-500">
                  Total: {lessons.length} | Active: {lessons.filter(l => !l.is_cancelled).length}
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {attendanceLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
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
                      <h4 className="text-md font-medium mb-3 text-green-600">Upcoming Lessons</h4>
                      <div className="space-y-2">
                        {upcomingLessons.map(lesson => {
                          const lessonDate = new Date(lesson.start_time)
                          const endDate = new Date(lesson.end_time)
                          const hasRecord = lessonRecords[lesson.id]

                          return (
                            <div key={lesson.id} className="bg-green-50 dark:bg-green-900/20 border border-green-200 p-3 rounded-lg">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">
                                    {lessonDate.toLocaleDateString('en-GB')} - {lessonDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {hasRecord ? '✅ Has lesson record' : '⚠️ No lesson record yet'}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => toggleLessonCancellation(lesson.id, lesson.is_cancelled)}
                                    className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => deleteLesson(lesson.id)}
                                    className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
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
                      <h4 className="text-md font-medium mb-3 text-blue-600">Recent Lessons</h4>
                      <div className="space-y-2">
                        {pastLessons.map(lesson => {
                          const lessonDate = new Date(lesson.start_time)
                          const endDate = new Date(lesson.end_time)
                          const hasRecord = lessonRecords[lesson.id]
                          const record = lessonRecords[lesson.id]

                          return (
                            <div
                              key={lesson.id}
                              className={`border p-3 rounded-lg ${
                                lesson.is_cancelled
                                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 opacity-75'
                                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className={`font-medium ${lesson.is_cancelled ? 'line-through' : ''}`}>
                                    {lessonDate.toLocaleDateString('en-GB')} - {lessonDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {lesson.is_cancelled && <span className="ml-2 text-red-600 text-sm">(Cancelled)</span>}
                                  </div>

                                  {hasRecord && record && (
                                    <div className="mt-2 space-y-1 text-sm">
                                      {record.covered && (
                                        <div>
                                          <span className="font-medium text-gray-600">Covered:</span>
                                          <span className="ml-2 text-gray-700">{record.covered.substring(0, 100)}{record.covered.length > 100 ? '...' : ''}</span>
                                        </div>
                                      )}
                                      {record.planned && (
                                        <div>
                                          <span className="font-medium text-gray-600">Planned Next:</span>
                                          <span className="ml-2 text-gray-700">{record.planned.substring(0, 100)}{record.planned.length > 100 ? '...' : ''}</span>
                                        </div>
                                      )}
                                      {record.homework && (
                                        <div>
                                          <span className="font-medium text-gray-600">Homework:</span>
                                          <span className="ml-2 text-gray-700">{record.homework.substring(0, 100)}{record.homework.length > 100 ? '...' : ''}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {!hasRecord && !lesson.is_cancelled && (
                                    <div className="mt-1 text-sm text-gray-500 italic">
                                      No lesson record - Go to Lessons page to add record and attendance
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-1 ml-4">
                                  {!lesson.is_cancelled ? (
                                    <>
                                      <button
                                        onClick={() => toggleLessonCancellation(lesson.id, lesson.is_cancelled)}
                                        className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => deleteLesson(lesson.id)}
                                        className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                                      >
                                        Delete
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => toggleLessonCancellation(lesson.id, lesson.is_cancelled)}
                                        className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                                      >
                                        Restore
                                      </button>
                                      <button
                                        onClick={() => deleteLesson(lesson.id)}
                                        className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                                      >
                                        Delete
                                      </button>
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
                    <button
                      onClick={() => {
                        // Link to lessons page - could be enhanced to navigate programmatically
                        window.location.href = '/lessons'
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      📚 Go to Lessons Page
                    </button>
                    <div className="text-sm text-gray-500 px-4 py-2">
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
                    <button
                      onClick={() => setEditingGroup(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Edit Settings
                    </button>
                    <button
                      onClick={deleteGroup}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                    >
                      Delete Group
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={updateGroupSettings}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setEditingGroup(false)
                        setEditGroupName(group.name)
                        setEditGroupTimeslots(group.timeslots || [])
                      }}
                      className="bg-gray-400 text-white px-4 py-2 rounded text-sm hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group Name
                </label>
                {editingGroup ? (
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <div className="text-gray-900 dark:text-white font-medium">{group.name}</div>
                )}
              </div>

              {/* School & Subject (Read-only) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    School
                  </label>
                  <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    {school.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    {subject.name}
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Schedule
                  </label>
                  {editingGroup && (
                    <button
                      onClick={addTimeslot}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Add Timeslot
                    </button>
                  )}
                </div>

                {editingGroup ? (
                  <div className="space-y-2">
                    {editGroupTimeslots.length === 0 ? (
                      <p className="text-gray-500 text-sm italic">No timeslots added yet</p>
                    ) : (
                      editGroupTimeslots.map((slot, index) => (
                        <div key={index} className="grid grid-cols-4 gap-2 items-center">
                          <select
                            value={slot.day}
                            onChange={(e) => updateTimeslot(index, 'day', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
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
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          />
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateTimeslot(index, 'endTime', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() => removeTimeslot(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {group.timeslots && group.timeslots.length > 0 ? (
                      group.timeslots.map((slot: any, index: number) => (
                        <div key={index} className="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded">
                          <strong>{slot.day}</strong> {slot.startTime} - {slot.endTime}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm italic bg-gray-50 dark:bg-gray-700 p-3 rounded">
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
                    <span className="text-gray-500">Students:</span>
                    <span className="ml-2 font-medium">{roster.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Weekly Hours:</span>
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
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6" aria-label="Group tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              aria-selected={activeTab === tab.id}
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
    </div>
  )
}