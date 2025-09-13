import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Lesson, Group, LessonRecord, RosterItem, Attendance, Material, LessonMaterial } from '../types/database'

interface LessonWithGroup extends Lesson {
  group: {
    name: string
    school: { name: string }
    subject: { name: string }
  }
}

export function Lessons() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<LessonWithGroup[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [lessonRecords, setLessonRecords] = useState<Record<string, LessonRecord>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [lessonDate, setLessonDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  // View states
  const [lessonFilter, setLessonFilter] = useState<'upcoming' | 'all'>('upcoming')

  // Lesson record states
  const [openLessonRecord, setOpenLessonRecord] = useState<string | null>(null)
  const [recordData, setRecordData] = useState({
    covered: '',
    planned: '',
    homework: '',
    notes: ''
  })
  const [lessonViewMode, setLessonViewMode] = useState<'simple' | 'advanced'>('simple')
  const [previousLessonData, setPreviousLessonData] = useState<LessonRecord | null>(null)

  // Attendance states
  const [groupRoster, setGroupRoster] = useState<RosterItem[]>([])
  const [attendance, setAttendance] = useState<Record<string, Attendance>>({})
  const [bulkAttendanceStatus, setBulkAttendanceStatus] = useState<'present' | 'absent' | 'late'>('present')
  const [editingAttendanceNote, setEditingAttendanceNote] = useState<string | null>(null)
  const [attendanceNoteText, setAttendanceNoteText] = useState('')

  // Materials states
  const [materials, setMaterials] = useState<Material[]>([])
  const [lessonMaterials, setLessonMaterials] = useState<Record<string, Material[]>>({})
  const [showMaterialSelector, setShowMaterialSelector] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch groups with school and subject info
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          school:schools(name),
          subject:subjects(name)
        `)
        .order('name')

      if (groupsError) throw groupsError

      // Fetch lessons with group info
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          *,
          group:groups(
            name,
            school:schools(name),
            subject:subjects(name)
          )
        `)
        .order('start_time', { ascending: true })

      if (lessonsError) throw lessonsError

      // Fetch lesson records
      const { data: recordsData, error: recordsError } = await supabase
        .from('lesson_records')
        .select('*')

      if (recordsError) throw recordsError

      // Index lesson records by lesson_id
      const recordsByLesson = (recordsData || []).reduce((acc, record) => {
        acc[record.lesson_id] = record
        return acc
      }, {} as Record<string, LessonRecord>)

      // Fetch materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .order('title')

      if (materialsError) throw materialsError

      // Fetch lesson materials
      const { data: lessonMaterialsData, error: lessonMaterialsError } = await supabase
        .from('lesson_materials')
        .select(`
          lesson_record_id,
          material:materials(*)
        `)

      if (lessonMaterialsError) throw lessonMaterialsError

      // Group materials by lesson record id
      const materialsByLessonRecord: Record<string, Material[]> = {}
      lessonMaterialsData?.forEach((lm: any) => {
        if (!materialsByLessonRecord[lm.lesson_record_id]) {
          materialsByLessonRecord[lm.lesson_record_id] = []
        }
        if (lm.material) {
          materialsByLessonRecord[lm.lesson_record_id].push(lm.material)
        }
      })

      setGroups(groupsData || [])
      setLessons(lessonsData || [])
      setLessonRecords(recordsByLesson)
      setMaterials(materialsData || [])
      setLessonMaterials(materialsByLessonRecord)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup || !lessonDate || !startTime || !endTime) return

    const startDateTime = new Date(`${lessonDate}T${startTime}`)
    const endDateTime = new Date(`${lessonDate}T${endTime}`)

    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          group_id: selectedGroup,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          is_cancelled: false,
        })
        .select(`
          *,
          group:groups(
            name,
            school:schools(name),
            subject:subjects(name)
          )
        `)
        .single()

      if (error) throw error

      setLessons([...lessons, data])
      setSelectedGroup('')
      setLessonDate('')
      setStartTime('')
      setEndTime('')
      setShowAddLesson(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const generateRecurringLessons = async (groupId: string, weeks: number = 12) => {
    const group = groups.find(g => g.id === groupId)
    if (!group || !group.timeslots || group.timeslots.length === 0) return

    const lessonsToCreate = []
    const today = new Date()

    for (let week = 0; week < weeks; week++) {
      for (const timeslot of group.timeslots) {
        const lessonDate = getNextDateForDay(timeslot.day, week)
        if (lessonDate < today && week === 0) continue // Skip past dates in first week

        const startDateTime = new Date(`${lessonDate.toISOString().split('T')[0]}T${timeslot.startTime}`)
        const endDateTime = new Date(`${lessonDate.toISOString().split('T')[0]}T${timeslot.endTime}`)

        lessonsToCreate.push({
          group_id: groupId,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          is_cancelled: false,
        })
      }
    }

    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert(lessonsToCreate)
        .select(`
          *,
          group:groups(
            name,
            school:schools(name),
            subject:subjects(name)
          )
        `)

      if (error) throw error

      setLessons([...lessons, ...data])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getNextDateForDay = (dayName: string, weeksFromNow: number = 0): Date => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const targetDay = days.indexOf(dayName)
    const today = new Date()
    const currentDay = today.getDay()

    let daysUntilTarget = targetDay - currentDay
    if (daysUntilTarget < 0) daysUntilTarget += 7

    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + daysUntilTarget + (weeksFromNow * 7))
    return targetDate
  }

  const toggleLessonCancellation = async (lessonId: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .update({ is_cancelled: !currentStatus })
        .eq('id', lessonId)
        .select(`
          *,
          group:groups(
            name,
            school:schools(name),
            subject:subjects(name)
          )
        `)
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

  const openLessonRecordForm = async (lessonId: string) => {
    try {
      // Check if lesson record exists, create if not
      let record = lessonRecords[lessonId]

      if (!record) {
        const { data, error } = await supabase
          .from('lesson_records')
          .insert({
            lesson_id: lessonId,
            covered: '',
            planned: '',
            homework: '',
            notes: ''
          })
          .select()
          .single()

        if (error) throw error

        record = data
        setLessonRecords({
          ...lessonRecords,
          [lessonId]: record
        })
      }

      // Find previous lesson for the same group
      const currentLesson = lessons.find(l => l.id === lessonId)
      if (currentLesson) {
        const groupLessons = lessons
          .filter(l => l.group_id === currentLesson.group_id && l.id !== lessonId)
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

        const currentLessonTime = new Date(currentLesson.start_time).getTime()
        const previousLesson = groupLessons
          .filter(l => new Date(l.start_time).getTime() < currentLessonTime)
          .pop() // Get the most recent previous lesson

        if (previousLesson && lessonRecords[previousLesson.id]) {
          setPreviousLessonData(lessonRecords[previousLesson.id])
        } else {
          setPreviousLessonData(null)
        }
      }

      // Load existing data into form
      setRecordData({
        covered: record.covered || '',
        planned: record.planned || '',
        homework: record.homework || '',
        notes: record.notes || ''
      })

      // Fetch group roster and attendance
      if (currentLesson) {
        // Get roster for this group
        const { data: rosterData, error: rosterError } = await supabase
          .from('roster_items')
          .select('*')
          .eq('group_id', currentLesson.group_id)
          .order('student_name')

        if (rosterError) throw rosterError

        setGroupRoster(rosterData || [])

        // Get existing attendance for this lesson
        if (record.id) {
          const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance')
            .select('*')
            .eq('lesson_record_id', record.id)

          if (attendanceError) throw attendanceError

          // Index attendance by roster_item_id
          const attendanceByStudent = (attendanceData || []).reduce((acc, att) => {
            acc[att.roster_item_id] = att
            return acc
          }, {} as Record<string, Attendance>)

          setAttendance(attendanceByStudent)
        } else {
          setAttendance({})
        }
      }

      // Set mobile-first default (simple view on mobile, advanced on desktop)
      const isMobile = window.innerWidth < 768
      setLessonViewMode(isMobile ? 'simple' : 'advanced')

      setOpenLessonRecord(lessonId)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const saveLessonRecord = async () => {
    if (!openLessonRecord) return

    try {
      const { data, error } = await supabase
        .from('lesson_records')
        .update({
          covered: recordData.covered,
          planned: recordData.planned,
          homework: recordData.homework,
          notes: recordData.notes
        })
        .eq('lesson_id', openLessonRecord)
        .select()
        .single()

      if (error) throw error

      setLessonRecords({
        ...lessonRecords,
        [openLessonRecord]: data
      })

      setOpenLessonRecord(null)
      setRecordData({ covered: '', planned: '', homework: '', notes: '' })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const copyPlannedToCovered = () => {
    setRecordData({
      ...recordData,
      covered: recordData.planned
    })
  }

  const copyPreviousToCovered = () => {
    if (previousLessonData?.planned) {
      setRecordData({
        ...recordData,
        covered: previousLessonData.planned
      })
    }
  }

  const markAllAttendance = async (status: 'present' | 'absent' | 'late') => {
    if (!openLessonRecord) return

    const currentRecord = lessonRecords[openLessonRecord]
    if (!currentRecord) return

    try {
      const attendanceRecords = groupRoster.map(student => ({
        lesson_record_id: currentRecord.id,
        roster_item_id: student.id,
        status: status,
        note: null
      }))

      // Delete existing attendance for this lesson record
      await supabase
        .from('attendance')
        .delete()
        .eq('lesson_record_id', currentRecord.id)

      // Insert new attendance records
      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceRecords)
        .select()

      if (error) throw error

      // Update local state
      const newAttendance = (data || []).reduce((acc, att) => {
        acc[att.roster_item_id] = att
        return acc
      }, {} as Record<string, Attendance>)

      setAttendance(newAttendance)
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
      const existingAttendance = attendance[studentId]

      if (existingAttendance) {
        // Update existing attendance
        const { data, error } = await supabase
          .from('attendance')
          .update({ status, note: note || null })
          .eq('id', existingAttendance.id)
          .select()
          .single()

        if (error) throw error

        setAttendance({
          ...attendance,
          [studentId]: data
        })
      } else {
        // Create new attendance record
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            lesson_record_id: currentRecord.id,
            roster_item_id: studentId,
            status,
            note: note || null
          })
          .select()
          .single()

        if (error) throw error

        setAttendance({
          ...attendance,
          [studentId]: data
        })
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const saveAttendanceNote = async (studentId: string) => {
    if (!openLessonRecord) return

    const currentRecord = lessonRecords[openLessonRecord]
    if (!currentRecord) return

    try {
      const existingAttendance = attendance[studentId]
      const currentStatus = existingAttendance?.status || 'present'

      if (existingAttendance) {
        // Update existing attendance note
        const { data, error } = await supabase
          .from('attendance')
          .update({ note: attendanceNoteText || null })
          .eq('id', existingAttendance.id)
          .select()
          .single()

        if (error) throw error

        setAttendance({
          ...attendance,
          [studentId]: data
        })
      } else {
        // Create new attendance record with note
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            lesson_record_id: currentRecord.id,
            roster_item_id: studentId,
            status: currentStatus,
            note: attendanceNoteText || null
          })
          .select()
          .single()

        if (error) throw error

        setAttendance({
          ...attendance,
          [studentId]: data
        })
      }

      setEditingAttendanceNote(null)
      setAttendanceNoteText('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Materials functions
  const openMaterialSelector = (lessonRecordId: string) => {
    const currentMaterials = lessonMaterials[lessonRecordId] || []
    setSelectedMaterials(currentMaterials.map(m => m.id))
    setShowMaterialSelector(true)
  }

  const attachMaterials = async () => {
    if (!openLessonRecord) return

    const currentRecord = lessonRecords[openLessonRecord]
    if (!currentRecord) return

    try {
      // Remove existing materials
      await supabase
        .from('lesson_materials')
        .delete()
        .eq('lesson_record_id', currentRecord.id)

      // Add new materials
      if (selectedMaterials.length > 0) {
        const materialInserts = selectedMaterials.map(materialId => ({
          lesson_record_id: currentRecord.id,
          material_id: materialId
        }))

        const { error } = await supabase
          .from('lesson_materials')
          .insert(materialInserts)

        if (error) throw error
      }

      // Update local state
      const attachedMaterials = materials.filter(m => selectedMaterials.includes(m.id))
      setLessonMaterials({
        ...lessonMaterials,
        [currentRecord.id]: attachedMaterials
      })

      setShowMaterialSelector(false)
      setSelectedMaterials([])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const removeMaterial = async (lessonRecordId: string, materialId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_materials')
        .delete()
        .eq('lesson_record_id', lessonRecordId)
        .eq('material_id', materialId)

      if (error) throw error

      // Update local state
      const currentMaterials = lessonMaterials[lessonRecordId] || []
      setLessonMaterials({
        ...lessonMaterials,
        [lessonRecordId]: currentMaterials.filter(m => m.id !== materialId)
      })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const filteredLessons = lessonFilter === 'upcoming'
    ? lessons.filter(lesson => new Date(lesson.start_time) >= new Date())
    : lessons

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const groupedLessons = filteredLessons.reduce((acc, lesson) => {
    const dateKey = formatDateTime(lesson.start_time).date
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(lesson)
    return acc
  }, {} as Record<string, LessonWithGroup[]>)

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
        <h2 className="text-2xl font-bold">Lessons</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setLessonFilter(lessonFilter === 'upcoming' ? 'all' : 'upcoming')}
            className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 text-sm"
          >
            {lessonFilter === 'upcoming' ? 'Show All' : 'Show Upcoming'}
          </button>
          <button
            onClick={() => setShowAddLesson(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={groups.length === 0}
          >
            Add Lesson
          </button>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          You need to create groups before adding lessons.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Recurring Lessons Section */}
      {groups.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Generate Recurring Lessons</h3>
          <div className="space-y-2">
            {groups.map(group => (
              <div key={group.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded">
                <div>
                  <span className="font-medium">{group.name}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({(group as any).school?.name} • {(group as any).subject?.name})
                  </span>
                  {group.timeslots && group.timeslots.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {group.timeslots.map((slot: any, i: number) => (
                        <span key={i} className="mr-2">
                          {slot.day} {slot.startTime}-{slot.endTime}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => generateRecurringLessons(group.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  disabled={!group.timeslots || group.timeslots.length === 0}
                >
                  Generate 12 Weeks
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddLesson && (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <form onSubmit={addLesson} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Group</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select Group</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({(group as any).school?.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={lessonDate}
                  onChange={(e) => setLessonDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Lesson
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddLesson(false)
                  setSelectedGroup('')
                  setLessonDate('')
                  setStartTime('')
                  setEndTime('')
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lessons List */}
      <div className="space-y-4">
        {Object.keys(groupedLessons).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No lessons yet. Add individual lessons or generate recurring lessons from your groups!
          </div>
        ) : (
          Object.entries(groupedLessons).map(([date, dayLessons]) => (
            <div key={date} className="bg-white dark:bg-gray-800 border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">{date}</h3>
              <div className="space-y-2">
                {dayLessons.map((lesson) => {
                  const { time: startTime } = formatDateTime(lesson.start_time)
                  const { time: endTime } = formatDateTime(lesson.end_time)

                  return (
                    <div
                      key={lesson.id}
                      className={`flex justify-between items-center p-3 rounded ${
                        lesson.is_cancelled
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200'
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <div className={lesson.is_cancelled ? 'opacity-60 line-through' : ''}>
                        <div className="font-medium">
                          {lesson.group.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lesson.group.school.name} • {lesson.group.subject.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {startTime} - {endTime}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openLessonRecordForm(lesson.id)}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          View Lesson
                        </button>
                        <button
                          onClick={() => toggleLessonCancellation(lesson.id, lesson.is_cancelled)}
                          className={`px-2 py-1 rounded text-xs ${
                            lesson.is_cancelled
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-yellow-600 text-white hover:bg-yellow-700'
                          }`}
                        >
                          {lesson.is_cancelled ? 'Restore' : 'Cancel'}
                        </button>
                        <button
                          onClick={() => deleteLesson(lesson.id)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Enhanced Lesson Record Modal */}
      {openLessonRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {lessons.find(l => l.id === openLessonRecord)?.group.name} - Lesson Record
                </h2>
                <p className="text-sm text-gray-500">
                  {lessons.find(l => l.id === openLessonRecord)?.group.school.name} • {lessons.find(l => l.id === openLessonRecord)?.group.subject.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setLessonViewMode('simple')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      lessonViewMode === 'simple'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Simple
                  </button>
                  <button
                    onClick={() => setLessonViewMode('advanced')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      lessonViewMode === 'advanced'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Advanced
                  </button>
                </div>
                <button
                  onClick={() => {
                    setOpenLessonRecord(null)
                    setRecordData({ covered: '', planned: '', homework: '', notes: '' })
                    setPreviousLessonData(null)
                    setGroupRoster([])
                    setAttendance({})
                    setEditingAttendanceNote(null)
                    setAttendanceNoteText('')
                    setShowMaterialSelector(false)
                    setSelectedMaterials([])
                  }}
                  className="text-gray-500 hover:text-gray-700 text-xl min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content - Responsive Layout */}
            <div className="flex-1 overflow-y-auto">
              <div className={`${lessonViewMode === 'advanced' ? 'md:flex' : ''} h-full`}>
                {/* Previous Lesson Context - Advanced View Only */}
                {lessonViewMode === 'advanced' && (
                  <div className="md:w-80 border-b md:border-b-0 md:border-r bg-gray-50 dark:bg-gray-900/50 p-4">
                    <h3 className="font-semibold text-sm mb-3">Previous Lesson</h3>
                    {previousLessonData ? (
                      <div className="space-y-3">
                        {previousLessonData.planned && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Planned:</p>
                            <div className="text-sm bg-white dark:bg-gray-800 p-2 rounded border">
                              {previousLessonData.planned}
                            </div>
                            <button
                              onClick={copyPreviousToCovered}
                              className="mt-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 w-full"
                            >
                              Copy → Covered
                            </button>
                          </div>
                        )}
                        {previousLessonData.homework && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Homework:</p>
                            <div className="text-sm bg-white dark:bg-gray-800 p-2 rounded border">
                              {previousLessonData.homework}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No previous lesson found</p>
                    )}
                  </div>
                )}

                {/* Lesson Record Form */}
                <div className="flex-1 p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex flex-wrap gap-2 items-center mb-2">
                        <label className="block text-sm font-medium">What was covered today?</label>
                        {recordData.planned && (
                          <button
                            onClick={copyPlannedToCovered}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                          >
                            Copy Planned → Covered
                          </button>
                        )}
                      </div>
                      <textarea
                        value={recordData.covered}
                        onChange={(e) => setRecordData({ ...recordData, covered: e.target.value })}
                        placeholder="Topics covered, activities completed, progress made..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 h-20 md:h-24 resize-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Planned for next lesson</label>
                      <textarea
                        value={recordData.planned}
                        onChange={(e) => setRecordData({ ...recordData, planned: e.target.value })}
                        placeholder="Topics to cover, activities to do, goals for next lesson..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 h-20 md:h-24 resize-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Homework assigned</label>
                      <textarea
                        value={recordData.homework}
                        onChange={(e) => setRecordData({ ...recordData, homework: e.target.value })}
                        placeholder="Homework assignments, practice exercises, reading..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 h-16 md:h-20 resize-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Notes</label>
                      <textarea
                        value={recordData.notes}
                        onChange={(e) => setRecordData({ ...recordData, notes: e.target.value })}
                        placeholder="Additional notes, student behavior, important observations..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 h-16 md:h-20 resize-none text-sm"
                      />
                    </div>

                    {/* Materials Section */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold">Materials ({lessonMaterials[lessonRecords[openLessonRecord]?.id]?.length || 0})</h3>
                        <button
                          onClick={() => openMaterialSelector(lessonRecords[openLessonRecord]?.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Attach Materials
                        </button>
                      </div>

                      {lessonRecords[openLessonRecord] && lessonMaterials[lessonRecords[openLessonRecord].id]?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {lessonMaterials[lessonRecords[openLessonRecord].id].map((material) => (
                            <div
                              key={material.id}
                              className="bg-gray-50 dark:bg-gray-700 p-3 rounded border flex justify-between items-start"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{material.title}</div>
                                {material.description && (
                                  <div className="text-xs text-gray-500 mt-1">{material.description}</div>
                                )}
                                {material.file_url && (
                                  <a
                                    href={material.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block break-all"
                                  >
                                    View File →
                                  </a>
                                )}
                              </div>
                              <button
                                onClick={() => removeMaterial(lessonRecords[openLessonRecord].id, material.id)}
                                className="text-red-600 hover:text-red-800 text-sm ml-2 flex-shrink-0"
                                title="Remove material"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500 italic text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded">
                          No materials attached. Click "Attach Materials" to add resources to this lesson.
                        </div>
                      )}
                    </div>

                    {/* Attendance Section */}
                    {groupRoster.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">Attendance</h3>
                          <div className="flex items-center gap-2">
                            <select
                              value={bulkAttendanceStatus}
                              onChange={(e) => setBulkAttendanceStatus(e.target.value as 'present' | 'absent' | 'late')}
                              className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="late">Late</option>
                            </select>
                            <button
                              onClick={() => markAllAttendance(bulkAttendanceStatus)}
                              className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 min-h-[32px]"
                            >
                              Mark All {bulkAttendanceStatus}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {groupRoster.map((student) => {
                            const studentAttendance = attendance[student.id]
                            const attendanceStatus = studentAttendance?.status || 'present'

                            return (
                              <div key={student.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex-1 font-medium text-sm">
                                    {student.student_name}
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => updateStudentAttendance(student.id, 'present')}
                                      className={`px-2 py-1 rounded text-xs min-w-[60px] ${
                                        attendanceStatus === 'present'
                                          ? 'bg-green-600 text-white'
                                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900'
                                      }`}
                                    >
                                      Present
                                    </button>
                                    <button
                                      onClick={() => updateStudentAttendance(student.id, 'absent')}
                                      className={`px-2 py-1 rounded text-xs min-w-[60px] ${
                                        attendanceStatus === 'absent'
                                          ? 'bg-red-600 text-white'
                                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900'
                                      }`}
                                    >
                                      Absent
                                    </button>
                                    <button
                                      onClick={() => updateStudentAttendance(student.id, 'late')}
                                      className={`px-2 py-1 rounded text-xs min-w-[60px] ${
                                        attendanceStatus === 'late'
                                          ? 'bg-yellow-600 text-white'
                                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900'
                                      }`}
                                    >
                                      Late
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEditingAttendanceNote(student.id)
                                      setAttendanceNoteText(studentAttendance?.note || '')
                                    }}
                                    className="text-gray-500 hover:text-gray-700 text-xs px-1 py-1 rounded"
                                    title="Add note"
                                  >
                                    📝
                                  </button>
                                </div>

                                {editingAttendanceNote === student.id ? (
                                  <div className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={attendanceNoteText}
                                      onChange={(e) => setAttendanceNoteText(e.target.value)}
                                      placeholder="Add attendance note..."
                                      className="flex-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => saveAttendanceNote(student.id)}
                                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingAttendanceNote(null)
                                        setAttendanceNoteText('')
                                      }}
                                      className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-400"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : studentAttendance?.note ? (
                                  <div className="text-xs text-gray-500 italic bg-white dark:bg-gray-700 p-1 rounded border">
                                    {studentAttendance.note}
                                  </div>
                                ) : null}
                              </div>
                            )
                          })}
                        </div>

                        {/* Attendance Summary */}
                        {Object.keys(attendance).length > 0 && (
                          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                            Present: {Object.values(attendance).filter(a => a.status === 'present').length} •
                            Absent: {Object.values(attendance).filter(a => a.status === 'absent').length} •
                            Late: {Object.values(attendance).filter(a => a.status === 'late').length}
                            {groupRoster.length > 0 && (
                              <span className="ml-2 font-medium">
                                ({Math.round((Object.values(attendance).filter(a => a.status === 'present' || a.status === 'late').length / groupRoster.length) * 100)}% attended)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4">
              <div className="flex gap-3">
                <button
                  onClick={saveLessonRecord}
                  className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 flex-1 font-medium min-h-[44px]"
                >
                  Save Record
                </button>
                <button
                  onClick={() => {
                    setOpenLessonRecord(null)
                    setRecordData({ covered: '', planned: '', homework: '', notes: '' })
                    setPreviousLessonData(null)
                    setGroupRoster([])
                    setAttendance({})
                    setEditingAttendanceNote(null)
                    setAttendanceNoteText('')
                    setShowMaterialSelector(false)
                    setSelectedMaterials([])
                  }}
                  className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded hover:bg-gray-400 dark:hover:bg-gray-500 min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Selector Modal */}
      {showMaterialSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[70vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Select Materials to Attach</h3>
              <button
                onClick={() => {
                  setShowMaterialSelector(false)
                  setSelectedMaterials([])
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {materials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No materials found in your library.</p>
                  <p className="text-sm mt-2">Visit the Materials page to create materials first.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {materials.map((material) => (
                    <label
                      key={material.id}
                      className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(material.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMaterials([...selectedMaterials, material.id])
                          } else {
                            setSelectedMaterials(selectedMaterials.filter(id => id !== material.id))
                          }
                        }}
                        className="mt-1 h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{material.title}</div>
                        {material.description && (
                          <div className="text-sm text-gray-500 mt-1">{material.description}</div>
                        )}
                        {material.file_url && (
                          <div className="text-xs text-blue-600 mt-1">Has attached file</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => {
                  setShowMaterialSelector(false)
                  setSelectedMaterials([])
                }}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={attachMaterials}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={materials.length === 0}
              >
                Attach {selectedMaterials.length} Material{selectedMaterials.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}