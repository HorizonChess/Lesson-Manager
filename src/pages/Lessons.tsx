import { useState, useEffect, useMemo } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { israeliCalendar } from '../services/israeliCalendar'
import type { Lesson, Group, LessonRecord, RosterItem, Attendance, Material } from '../types/database'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)
const DnDCalendar = withDragAndDrop(Calendar)

interface LessonWithGroup extends Lesson {
  group: {
    name: string
    school: { name: string }
    subject: { name: string }
  }
}

interface CalendarEvent {
  title: string
  start: Date
  end: Date
  resource?: any
}

interface LessonEvent extends CalendarEvent {
  id: string
  lesson: LessonWithGroup
  isVacationDay: boolean
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
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<'calendar' | 'list'>('calendar')

  // Removed custom drag states - using react-big-calendar built-in DnD

  // Recurring lessons modal states
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [recurringFormData, setRecurringFormData] = useState({
    groupId: '',
    weeks: 12,
    startDate: moment().format('YYYY-MM-DD'),
    endDate: '',
    template: 'custom' as 'semester' | 'year' | 'custom',
    // For editing existing patterns
    editingPatternId: '',
    newDay: 'Monday',
    newStartTime: '09:00',
    newEndTime: '10:00'
  })
  const [showCreateNew, setShowCreateNew] = useState(false)

  // Lesson record states
  const [openLessonRecord, setOpenLessonRecord] = useState<string | null>(null)
  const [recordData, setRecordData] = useState({
    covered: '',
    planned: '',
    homework: '',
    notes: ''
  })

  // Time editing states
  const [isEditingTime, setIsEditingTime] = useState(false)
  const [editTimeData, setEditTimeData] = useState({
    date: '',
    startTime: '',
    endTime: ''
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
      let { data: lessonsData, error: lessonsError } = await supabase
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

      // Clean up lessons scheduled on vacation days
      const lessonsToDelete: string[] = []
      lessonsData?.forEach((lesson: any) => {
        const lessonDate = new Date(lesson.start_time)
        if (israeliCalendar.isVacationDay(lessonDate)) {
          lessonsToDelete.push(lesson.id)
          console.log(`Found lesson on vacation day: ${lessonDate.toLocaleDateString()} - ${lesson.group?.name}`)
        }
      })

      // Delete lessons on vacation days
      if (lessonsToDelete.length > 0) {
        console.log(`Deleting ${lessonsToDelete.length} lessons scheduled on vacation days`)
        const { error: deleteError } = await supabase
          .from('lessons')
          .delete()
          .in('id', lessonsToDelete)

        if (deleteError) {
          console.error('Error deleting vacation lessons:', deleteError)
        } else {
          // Filter out deleted lessons from the data
          lessonsData = lessonsData?.filter((lesson: any) => !lessonsToDelete.includes(lesson.id)) || []
        }
      }

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

    // Check if the lesson is on a vacation day
    if (israeliCalendar.isVacationDay(startDateTime)) {
      const vacationPeriod = israeliCalendar.getVacationPeriod(startDateTime)
      const vacationName = vacationPeriod ? vacationPeriod.name : 'a vacation period'

      const confirmCreate = window.confirm(
        `⚠️ This lesson is scheduled during ${vacationName} (${startDateTime.toLocaleDateString()}).\n\nAre you sure you want to create this lesson?`
      )

      if (!confirmCreate) {
        return // User cancelled, don't create the lesson
      }
    }

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
    let skippedVacationDays = 0

    for (let week = 0; week < weeks; week++) {
      for (const timeslot of group.timeslots) {
        const lessonDate = getNextDateForDay(timeslot.day, week)
        if (lessonDate < today && week === 0) continue // Skip past dates in first week

        // Check if the lesson date falls on a vacation day
        if (israeliCalendar.isVacationDay(lessonDate)) {
          skippedVacationDays++
          console.log(`Skipping lesson on ${lessonDate.toLocaleDateString()} - vacation day: ${israeliCalendar.getVacationPeriod(lessonDate)?.name}`)
          continue // Skip this lesson - it's during vacation
        }

        // Check if it's during summer break or outside school year
        if (!israeliCalendar.isSchoolDay(lessonDate)) {
          skippedVacationDays++
          console.log(`Skipping lesson on ${lessonDate.toLocaleDateString()} - not a school day`)
          continue
        }

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

    // Show user how many vacation days were automatically skipped
    if (skippedVacationDays > 0) {
      console.log(`Automatically skipped ${skippedVacationDays} lessons during vacation periods`)
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

  // Convert lessons to calendar events
  const calendarEvents: LessonEvent[] = useMemo(() => {
    return lessons.map(lesson => {
      const startDate = new Date(lesson.start_time)
      const endDate = new Date(lesson.end_time)
      const isVacationDay = israeliCalendar.isVacationDay(startDate)

      return {
        id: lesson.id,
        title: lesson.group.name,
        start: startDate,
        end: endDate,
        lesson,
        isVacationDay,
        resource: {
          school: lesson.group.school.name,
          subject: lesson.group.subject.name,
          cancelled: lesson.is_cancelled
        }
      }
    })
  }, [lessons])

  // Calendar event handlers
  const handleSelectEvent = (event: LessonEvent) => {
    openLessonRecordForm(event.lesson.id)
  }

  const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
    // Don't allow selection on vacation days
    if (israeliCalendar.isVacationDay(start)) {
      const vacationPeriod = israeliCalendar.getVacationPeriod(start)
      alert(`Cannot schedule lessons during ${vacationPeriod?.name || 'vacation period'}`)
      return
    }

    // Set up form for new lesson creation
    setLessonDate(start.toISOString().split('T')[0])
    setStartTime(moment(start).format('HH:mm'))
    setEndTime(moment(end).format('HH:mm'))
    setShowAddLesson(true)
  }

  // Calendar style getters
  const eventStyleGetter = (event: LessonEvent) => {
    let backgroundColor = '#3174ad'
    let borderColor = '#265985'

    // Color code by school
    const schoolHash = event.lesson.group.school.name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)

    const hue = Math.abs(schoolHash) % 360
    backgroundColor = `hsl(${hue}, 60%, 50%)`
    borderColor = `hsl(${hue}, 60%, 35%)`

    if (event.lesson.is_cancelled) {
      backgroundColor = '#dc2626'
      borderColor = '#b91c1c'
    }

    if (event.isVacationDay) {
      backgroundColor = '#6b7280'
      borderColor = '#4b5563'
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: `2px solid ${borderColor}`,
        borderRadius: '4px',
        opacity: event.lesson.is_cancelled ? 0.7 : 1,
        fontSize: '12px',
        fontWeight: '500'
      }
    }
  }

  const dayStyleGetter = (date: Date) => {
    if (israeliCalendar.isVacationDay(date)) {
      return {
        style: {
          backgroundColor: '#fef3c7',
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,.1) 10px, rgba(0,0,0,.1) 20px)'
        }
      }
    }
    return {}
  }

  // Built-in drag and drop handler for react-big-calendar
  const handleEventDrop = async ({ event, start, end }: { event: LessonEvent, start: Date, end: Date }) => {
    await smartScheduleLesson(event.lesson.id, start, end)
  }

  // Smart scheduling function that handles conflicts
  const smartScheduleLesson = async (lessonId: string, newStart: Date, newEnd: Date) => {
    // Don't allow scheduling on vacation days
    if (israeliCalendar.isVacationDay(newStart)) {
      const vacationPeriod = israeliCalendar.getVacationPeriod(newStart)
      alert(`Cannot schedule lessons during ${vacationPeriod?.name || 'vacation period'}`)
      return
    }

    const lesson = lessons.find(l => l.id === lessonId)
    if (!lesson) return

    // Calculate the duration to maintain it
    const originalDuration = moment(lesson.end_time).diff(moment(lesson.start_time), 'minutes')
    const finalEndTime = moment(newStart).add(originalDuration, 'minutes').toDate()

    // Find overlapping lessons
    const overlappingLessons = lessons.filter(otherLesson => {
      if (otherLesson.id === lessonId) return false

      const otherStart = moment(otherLesson.start_time)
      const otherEnd = moment(otherLesson.end_time)
      const newStartMoment = moment(newStart)
      const newEndMoment = moment(finalEndTime)

      return (newStartMoment.isBefore(otherEnd) && newEndMoment.isAfter(otherStart))
    })

    // If no conflicts, move the lesson
    if (overlappingLessons.length === 0) {
      await moveLessonToNewTime(lessonId, newStart, finalEndTime)
      return
    }

    // Ask user if they want to auto-reschedule conflicting lessons
    const conflictingNames = overlappingLessons.map(l => l.group.name).join(', ')
    const shouldReschedule = window.confirm(
      `This time slot conflicts with: ${conflictingNames}\n\nWould you like to automatically move the conflicting lessons to available time slots?`
    )

    if (!shouldReschedule) {
      return // User cancelled, don't move anything
    }

    try {
      // Smart conflict resolution: find next available slots for conflicting lessons
      const reschedulePromises = []
      const rescheduledLessons: string[] = []
      let allSlotsFound = true

      // First, find slots for all conflicting lessons
      for (const conflictingLesson of overlappingLessons) {
        const conflictDuration = moment(conflictingLesson.end_time).diff(moment(conflictingLesson.start_time), 'minutes')
        const newSlot = findNextAvailableSlot(finalEndTime, conflictDuration, conflictingLesson.id)

        if (newSlot) {
          reschedulePromises.push({
            lessonId: conflictingLesson.id,
            newStart: newSlot.start,
            newEnd: newSlot.end,
            lessonName: conflictingLesson.group.name
          })
        } else {
          allSlotsFound = false
          alert(`Could not find available time slot for "${conflictingLesson.group.name}". Please manually reschedule this lesson.`)
        }
      }

      if (!allSlotsFound) {
        return // Don't proceed if we can't reschedule all conflicts
      }

      // Move the main lesson first
      await moveLessonToNewTime(lessonId, newStart, finalEndTime)

      // Then move all conflicting lessons
      for (const reschedule of reschedulePromises) {
        await moveLessonToNewTime(reschedule.lessonId, reschedule.newStart, reschedule.newEnd)
        rescheduledLessons.push(`${reschedule.lessonName} → ${moment(reschedule.newStart).format('ddd HH:mm')}`)
      }

      // Show success message
      if (rescheduledLessons.length > 0) {
        alert(`✅ Lesson moved successfully!\n\nAutomatically rescheduled:\n${rescheduledLessons.join('\n')}`)
      }
    } catch (error) {
      alert('Error moving lessons. Please try again.')
      console.error('Error in smart scheduling:', error)
    }
  }

  // Helper function to find next available time slot with better logic
  const findNextAvailableSlot = (afterTime: Date, durationMinutes: number, excludeLessonId: string, maxAttempts = 48): { start: Date, end: Date } | null => {
    let attempts = 0
    let searchTime = moment(afterTime)

    while (attempts < maxAttempts) {
      const startTime = searchTime.clone()
      const endTime = startTime.clone().add(durationMinutes, 'minutes')

      // Skip if outside working hours (7 AM - 10 PM)
      if (startTime.hour() < 7 || endTime.hour() >= 22) {
        searchTime = searchTime.clone().add(1, 'day').hour(7).minute(0).second(0)
        attempts++
        continue
      }

      // Skip vacation days
      if (israeliCalendar.isVacationDay(startTime.toDate())) {
        searchTime = searchTime.clone().add(1, 'day').hour(7).minute(0).second(0)
        attempts++
        continue
      }

      // Check if this slot conflicts with any other lessons
      const hasConflict = lessons.some(lesson => {
        if (lesson.id === excludeLessonId) return false

        const lessonStart = moment(lesson.start_time)
        const lessonEnd = moment(lesson.end_time)

        return (startTime.isBefore(lessonEnd) && endTime.isAfter(lessonStart))
      })

      if (!hasConflict) {
        return { start: startTime.toDate(), end: endTime.toDate() }
      }

      // Try 30 minutes later
      searchTime = searchTime.clone().add(30, 'minutes')
      attempts++
    }

    // If we can't find a slot within reasonable time, return null
    return null
  }


  // Update lesson time manually from modal
  const updateLessonTime = async () => {
    if (!openLessonRecord) return

    try {
      const lesson = lessons.find(l => l.id === openLessonRecord)
      if (!lesson) return

      // Parse the edited date and times
      const newStartDateTime = moment(`${editTimeData.date} ${editTimeData.startTime}`)
      const newEndDateTime = moment(`${editTimeData.date} ${editTimeData.endTime}`)

      // Validate times
      if (!newStartDateTime.isValid() || !newEndDateTime.isValid()) {
        alert('Invalid date or time format')
        return
      }

      if (newEndDateTime.isBefore(newStartDateTime)) {
        alert('End time must be after start time')
        return
      }

      // Update in database
      const { error } = await supabase
        .from('lessons')
        .update({
          start_time: newStartDateTime.toISOString(),
          end_time: newEndDateTime.toISOString()
        })
        .eq('id', openLessonRecord)

      if (error) throw error

      // Update local state
      setLessons(prev => prev.map(l =>
        l.id === openLessonRecord
          ? { ...l, start_time: newStartDateTime.toISOString(), end_time: newEndDateTime.toISOString() }
          : l
      ))

      setIsEditingTime(false)
      alert('Lesson time updated successfully!')
    } catch (error) {
      console.error('Error updating lesson time:', error)
      alert('Failed to update lesson time')
    }
  }

  const moveLessonToNewTime = async (lessonId: string, newStartTime: Date, newEndTime: Date) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .update({
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString()
        })
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

      // Update local state
      setLessons(lessons.map(lesson =>
        lesson.id === lessonId ? data : lesson
      ))

    } catch (err: any) {
      setError(`Failed to move lesson: ${err.message}`)
    }
  }

  // Function to identify recurring patterns with better separation logic
  const getRecurringPatterns = () => {
    const groupedLessons: Record<string, LessonWithGroup[]> = {}

    // First, group lessons by group_id, day, and time
    lessons.forEach(lesson => {
      const day = moment(lesson.start_time).format('dddd')
      const time = `${moment(lesson.start_time).format('HH:mm')}-${moment(lesson.end_time).format('HH:mm')}`
      const key = `${lesson.group_id}-${day}-${time}`

      if (!groupedLessons[key]) {
        groupedLessons[key] = []
      }
      groupedLessons[key].push(lesson)
    })

    const patterns: {
      id: string
      groupId: string
      groupName: string
      schoolName: string
      subjectName: string
      day: string
      time: string
      lessons: LessonWithGroup[]
      startDate: string
      endDate: string
    }[] = []

    // For each group of lessons with same day/time, identify separate recurring series
    Object.entries(groupedLessons).forEach(([baseKey, lessonsGroup]) => {
      if (lessonsGroup.length < 2) return // Skip single lessons

      // Sort lessons by date
      const sortedLessons = lessonsGroup.sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )

      // Identify separate recurring series by analyzing gaps between lessons
      const series: LessonWithGroup[][] = []
      let currentSeries: LessonWithGroup[] = [sortedLessons[0]]

      for (let i = 1; i < sortedLessons.length; i++) {
        const prevLesson = sortedLessons[i - 1]
        const currentLesson = sortedLessons[i]

        const prevDate = moment(prevLesson.start_time)
        const currentDate = moment(currentLesson.start_time)

        // Calculate expected next date (7 days later)
        const expectedNextDate = prevDate.clone().add(7, 'days')
        const daysDiff = currentDate.diff(prevDate, 'days')

        // If the gap is more than 3 weeks (21 days), start a new series
        // This accounts for some flexibility in scheduling while separating distinct patterns
        if (daysDiff > 21) {
          series.push([...currentSeries])
          currentSeries = [currentLesson]
        } else {
          currentSeries.push(currentLesson)
        }
      }

      // Add the last series
      if (currentSeries.length > 0) {
        series.push(currentSeries)
      }

      // Create pattern objects for series with 2+ lessons
      series.forEach((seriesLessons, seriesIndex) => {
        if (seriesLessons.length >= 2) {
          const firstLesson = seriesLessons[0]
          const lastLesson = seriesLessons[seriesLessons.length - 1]
          const day = moment(firstLesson.start_time).format('dddd')
          const time = `${moment(firstLesson.start_time).format('HH:mm')}-${moment(firstLesson.end_time).format('HH:mm')}`

          // Create unique ID that includes series info
          const patternId = `${baseKey}-series-${seriesIndex}-${moment(firstLesson.start_time).format('YYYY-MM-DD')}`

          patterns.push({
            id: patternId,
            groupId: firstLesson.group_id,
            groupName: firstLesson.group.name,
            schoolName: firstLesson.group.school.name,
            subjectName: firstLesson.group.subject.name,
            day,
            time,
            lessons: seriesLessons,
            startDate: moment(firstLesson.start_time).format('YYYY-MM-DD'),
            endDate: moment(lastLesson.start_time).format('YYYY-MM-DD')
          })
        }
      })
    })

    return patterns.sort((a, b) =>
      moment(a.startDate).diff(moment(b.startDate))
    )
  }

  // Function to bulk update recurring lesson timeslots
  const bulkUpdateRecurringLessons = async (
    lessonIds: string[],
    newDay: string,
    newStartTime: string,
    newEndTime: string
  ) => {
    try {
      // Calculate new times for each lesson
      const updates = lessonIds.map(lessonId => {
        const lesson = lessons.find(l => l.id === lessonId)
        if (!lesson) return null

        const originalDate = moment(lesson.start_time)
        const weekStart = originalDate.clone().startOf('week')

        // Convert day name to day number (0=Sunday, 1=Monday, etc.)
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const targetDayNumber = dayNames.indexOf(newDay)
        const newDate = weekStart.clone().day(targetDayNumber)

        // Parse time properly - handle both 12-hour and 24-hour formats
        const [startHour, startMinute] = newStartTime.split(':').map(Number)
        const [endHour, endMinute] = newEndTime.split(':').map(Number)

        const newStartDateTime = newDate.clone().set({
          hour: startHour,
          minute: startMinute,
          second: 0,
          millisecond: 0
        })
        const newEndDateTime = newDate.clone().set({
          hour: endHour,
          minute: endMinute,
          second: 0,
          millisecond: 0
        })

        return {
          id: lessonId,
          start_time: newStartDateTime.toISOString(),
          end_time: newEndDateTime.toISOString()
        }
      }).filter(Boolean)

      if (updates.length === 0) {
        throw new Error('No valid lessons to update')
      }

      // Use individual updates instead of upsert to avoid conflicts
      for (const update of updates) {
        const { error } = await supabase
          .from('lessons')
          .update({
            start_time: update.start_time,
            end_time: update.end_time
          })
          .eq('id', update.id)

        if (error) throw error
      }

      // Refresh lessons data
      await fetchData()

    } catch (err: any) {
      setError(`Failed to update recurring lessons: ${err.message}`)
      console.error('Bulk update error:', err)
    }
  }

  // Simple event component - click to open, drag to move (built-in)
  const SimpleEventComponent = ({ event }: { event: LessonEvent }) => {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs font-medium p-1 cursor-pointer hover:bg-black/10 transition-colors">
        <div className="truncate">{event.title}</div>
      </div>
    )
  }

  // No need for custom time slot wrapper - react-big-calendar handles this

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
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setCalendarView('calendar')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                calendarView === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setCalendarView('list')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                calendarView === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              List
            </button>
          </div>
          {calendarView === 'list' && (
            <button
              onClick={() => setLessonFilter(lessonFilter === 'upcoming' ? 'all' : 'upcoming')}
              className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 text-sm"
            >
              {lessonFilter === 'upcoming' ? 'Show All' : 'Show Upcoming'}
            </button>
          )}
          <button
            onClick={() => setShowAddLesson(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={groups.length === 0}
          >
            Add Lesson
          </button>
          <button
            onClick={() => setShowRecurringModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            disabled={groups.length === 0}
          >
            Manage Recurring
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

      {/* Recurring Lessons Management Modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Manage Recurring Lessons</h3>
              <button
                onClick={() => setShowRecurringModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {/* Group Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Select Group</label>
                  <select
                    value={recurringFormData.groupId}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, groupId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a group...</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({(group as any).school?.name} • {(group as any).subject?.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Existing Recurring Patterns */}
                {recurringFormData.groupId && (() => {
                  const selectedGroup = groups.find(g => g.id === recurringFormData.groupId)
                  const recurringPatterns = getRecurringPatterns().filter(p => p.groupId === recurringFormData.groupId)

                  return (
                    <div className="space-y-4">
                      {/* Group Info */}
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        <div className="font-medium">{selectedGroup?.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {(selectedGroup as any)?.school?.name} • {(selectedGroup as any)?.subject?.name}
                        </div>
                      </div>

                      {/* Existing Patterns */}
                      {recurringPatterns.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 text-blue-700 dark:text-blue-300">📅 Existing Recurring Lessons</h4>
                          <div className="space-y-3">
                            {recurringPatterns.map((pattern) => (
                              <div key={pattern.id} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-medium text-blue-900 dark:text-blue-100">
                                      {pattern.day} {pattern.time}
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400">
                                      {pattern.lessons.length} lessons • {moment(pattern.startDate).format('MMM D')} - {moment(pattern.endDate).format('MMM D, YYYY')}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (recurringFormData.editingPatternId === pattern.id) {
                                        // Cancel editing - collapse the section
                                        setRecurringFormData({ ...recurringFormData, editingPatternId: '' })
                                      } else {
                                        // Start editing - expand the section
                                        setRecurringFormData({
                                          ...recurringFormData,
                                          editingPatternId: pattern.id,
                                          newDay: pattern.day,
                                          newStartTime: pattern.time.split('-')[0],
                                          newEndTime: pattern.time.split('-')[1]
                                        })
                                      }
                                    }}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                  >
                                    {recurringFormData.editingPatternId === pattern.id ? 'Cancel' : 'Edit'}
                                  </button>
                                </div>

                                {recurringFormData.editingPatternId === pattern.id && (
                                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                                    <h5 className="font-medium mb-2 text-sm">Update Timeslot</h5>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                      <div>
                                        <label className="block text-xs font-medium mb-1">Day</label>
                                        <select
                                          value={recurringFormData.newDay}
                                          onChange={(e) => setRecurringFormData({ ...recurringFormData, newDay: e.target.value })}
                                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                                        >
                                          <option value="Sunday">Sunday</option>
                                          <option value="Monday">Monday</option>
                                          <option value="Tuesday">Tuesday</option>
                                          <option value="Wednesday">Wednesday</option>
                                          <option value="Thursday">Thursday</option>
                                          <option value="Friday">Friday</option>
                                          <option value="Saturday">Saturday</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium mb-1">Start Time</label>
                                        <input
                                          type="time"
                                          value={recurringFormData.newStartTime}
                                          onChange={(e) => setRecurringFormData({ ...recurringFormData, newStartTime: e.target.value })}
                                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium mb-1">End Time</label>
                                        <input
                                          type="time"
                                          value={recurringFormData.newEndTime}
                                          onChange={(e) => setRecurringFormData({ ...recurringFormData, newEndTime: e.target.value })}
                                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={async () => {
                                          await bulkUpdateRecurringLessons(
                                            pattern.lessons.map(l => l.id),
                                            recurringFormData.newDay,
                                            recurringFormData.newStartTime,
                                            recurringFormData.newEndTime
                                          )
                                          setRecurringFormData({ ...recurringFormData, editingPatternId: '' })
                                        }}
                                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                      >
                                        ✓ Update All {pattern.lessons.length} Lessons
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (confirm(`Are you sure you want to delete this recurring pattern?\n\nThis will permanently delete all ${pattern.lessons.length} lessons from ${moment(pattern.startDate).format('MMM D')} to ${moment(pattern.endDate).format('MMM D, YYYY')}.`)) {
                                            // Delete all lessons in this pattern
                                            const { error } = await supabase
                                              .from('lessons')
                                              .delete()
                                              .in('id', pattern.lessons.map(l => l.id))

                                            if (error) {
                                              setError(`Failed to delete pattern: ${error.message}`)
                                            } else {
                                              // Refresh data and close editing
                                              await fetchData()
                                              setRecurringFormData({ ...recurringFormData, editingPatternId: '' })
                                            }
                                          }
                                        }}
                                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                      >
                                        🗑️ Delete Pattern
                                      </button>
                                      <button
                                        onClick={() => setRecurringFormData({ ...recurringFormData, editingPatternId: '' })}
                                        className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Add New Pattern - Always Visible */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowCreateNew(!showCreateNew)}
                    className="w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-3 rounded text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">➕</span>
                      <span className="font-medium">Add New Recurring Pattern</span>
                    </div>
                  </button>

                  {showCreateNew && (
                    <div className="mt-3 bg-green-50 dark:bg-green-900/20 p-4 rounded border border-green-200">
                      <h4 className="font-semibold mb-3 text-green-700 dark:text-green-300">✨ Create New Recurring Lessons</h4>

                      {/* Quick Templates */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Quick Templates</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setRecurringFormData({ ...recurringFormData, template: 'semester', weeks: 16 })}
                            className={`p-3 rounded border text-sm ${
                              recurringFormData.template === 'semester'
                                ? 'bg-green-100 border-green-500 text-green-700'
                                : 'bg-white border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Semester<br/><span className="text-xs text-gray-500">16 weeks</span>
                          </button>
                          <button
                            onClick={() => setRecurringFormData({ ...recurringFormData, template: 'year', weeks: 40 })}
                            className={`p-3 rounded border text-sm ${
                              recurringFormData.template === 'year'
                                ? 'bg-green-100 border-green-500 text-green-700'
                                : 'bg-white border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Full Year<br/><span className="text-xs text-gray-500">40 weeks</span>
                          </button>
                          <button
                            onClick={() => setRecurringFormData({ ...recurringFormData, template: 'custom', weeks: 12 })}
                            className={`p-3 rounded border text-sm ${
                              recurringFormData.template === 'custom'
                                ? 'bg-green-100 border-green-500 text-green-700'
                                : 'bg-white border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Custom<br/><span className="text-xs text-gray-500">Set manually</span>
                          </button>
                        </div>
                      </div>

                      {/* Date Settings */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Start Date</label>
                          <input
                            type="date"
                            value={recurringFormData.startDate}
                            onChange={(e) => setRecurringFormData({ ...recurringFormData, startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">End Date</label>
                          <input
                            type="date"
                            value={recurringFormData.endDate}
                            onChange={(e) => setRecurringFormData({ ...recurringFormData, endDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                            placeholder="Optional"
                          />
                        </div>
                      </div>

                      {/* Custom Weeks */}
                      {recurringFormData.template === 'custom' && (
                        <div className="mb-3">
                          <label className="block text-sm font-medium mb-1">Number of Weeks</label>
                          <input
                            type="number"
                            min="1"
                            max="52"
                            value={recurringFormData.weeks}
                            onChange={(e) => setRecurringFormData({ ...recurringFormData, weeks: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            if (recurringFormData.groupId) {
                              generateRecurringLessons(recurringFormData.groupId, recurringFormData.weeks)
                              setShowCreateNew(false)
                            }
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                          disabled={!recurringFormData.groupId}
                        >
                          ✓ Create {recurringFormData.weeks} Week{recurringFormData.weeks !== 1 ? 's' : ''}
                        </button>
                        <button
                          onClick={() => setShowCreateNew(false)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => {
                  setShowRecurringModal(false)
                  setShowCreateNew(false)
                  setRecurringFormData({
                    ...recurringFormData,
                    editingPatternId: '',
                    groupId: ''
                  })
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
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

      {/* Calendar and List Views */}
      {calendarView === 'calendar' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
          {/* Calendar Toolbar */}
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 border-b">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(moment(currentDate).subtract(1, 'week').toDate())}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                title="Previous week"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Today
              </button>

              <button
                onClick={() => setCurrentDate(moment(currentDate).add(1, 'week').toDate())}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                title="Next week"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <h3 className="text-lg font-semibold">
              {moment(currentDate).startOf('week').format('MMM D')} - {moment(currentDate).endOf('week').format('MMM D, YYYY')}
            </h3>

            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#fef3c7', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,.1) 4px, rgba(0,0,0,.1) 8px)' }}></div>
                <span>Vacation</span>
              </div>
            </div>
          </div>

          {/* Calendar Component */}
          <div className="h-[600px]">
            <style dangerouslySetInnerHTML={{
              __html: `
                .rbc-calendar {
                  font-family: inherit;
                }
                .rbc-toolbar {
                  display: none; /* Hide default toolbar, we use custom one */
                }
                .rbc-time-view {
                  min-height: 600px;
                }
                .rbc-time-slot {
                  border-top: 1px solid #e5e7eb;
                }
                .rbc-time-slot:nth-child(even) {
                  border-top: 1px dashed #e5e7eb;
                }
                .rbc-timeslot-group {
                  min-height: 40px;
                }
                .rbc-event {
                  border-radius: 4px;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
                }
                .rbc-event:hover {
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }
                .rbc-header {
                  font-weight: 600;
                  padding: 12px 8px;
                  background: #f9fafb;
                  border-bottom: 2px solid #e5e7eb;
                }
                .dark .rbc-header {
                  background: #374151;
                  color: #f3f4f6;
                }
                .rbc-time-header-gutter,
                .rbc-time-gutter {
                  background: #f9fafb;
                  border-right: 2px solid #e5e7eb;
                }
                .dark .rbc-time-header-gutter,
                .dark .rbc-time-gutter {
                  background: #374151;
                  color: #f3f4f6;
                }
              `
            }} />

            <DnDCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              date={currentDate}
              onNavigate={setCurrentDate}
              view="week"
              views={['week']}
              step={15}
              timeslots={2}
              min={new Date(0, 0, 0, 7, 0)}
              max={new Date(0, 0, 0, 22, 0)}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              onEventDrop={handleEventDrop}
              resizable={false}
              selectable
              eventPropGetter={eventStyleGetter}
              dayPropGetter={dayStyleGetter}
              components={{
                event: SimpleEventComponent,
              }}
              formats={{
                timeGutterFormat: 'HH:mm',
                eventTimeRangeFormat: ({ start, end }: { start: Date, end: Date }) =>
                  `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
              }}
            />
          </div>
        </div>
      ) : (
        /* List View */
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
      )}

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

                {/* Date and Time Display/Edit */}
                <div className="mt-2">
                  {!isEditingTime ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {(() => {
                          const lesson = lessons.find(l => l.id === openLessonRecord)
                          if (!lesson) return ''
                          const date = moment(lesson.start_time).format('dddd, MMMM Do YYYY')
                          const startTime = moment(lesson.start_time).format('HH:mm')
                          const endTime = moment(lesson.end_time).format('HH:mm')
                          return `${date} • ${startTime} - ${endTime}`
                        })()}
                      </span>
                      <button
                        onClick={() => {
                          const lesson = lessons.find(l => l.id === openLessonRecord)
                          if (lesson) {
                            setEditTimeData({
                              date: moment(lesson.start_time).format('YYYY-MM-DD'),
                              startTime: moment(lesson.start_time).format('HH:mm'),
                              endTime: moment(lesson.end_time).format('HH:mm')
                            })
                            setIsEditingTime(true)
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                        title="Edit lesson time"
                      >
                        Edit Time
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="date"
                        value={editTimeData.date}
                        onChange={(e) => setEditTimeData(prev => ({ ...prev, date: e.target.value }))}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="time"
                        value={editTimeData.startTime}
                        onChange={(e) => setEditTimeData(prev => ({ ...prev, startTime: e.target.value }))}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-sm text-gray-500">to</span>
                      <input
                        type="time"
                        value={editTimeData.endTime}
                        onChange={(e) => setEditTimeData(prev => ({ ...prev, endTime: e.target.value }))}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={updateLessonTime}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditingTime(false)}
                        className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
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
                    setIsEditingTime(false)
                    setEditTimeData({ date: '', startTime: '', endTime: '' })
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
                        <h3 className="text-lg font-semibold">Lesson Plans ({lessonMaterials[lessonRecords[openLessonRecord]?.id]?.length || 0})</h3>
                        <button
                          onClick={() => openMaterialSelector(lessonRecords[openLessonRecord]?.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Attach Plans
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
                                title="Remove lesson plan"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500 italic text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded">
                          No lesson plans attached. Click "Attach Plans" to add resources to this lesson.
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
              <h3 className="text-lg font-bold">Select Lesson Plans to Attach</h3>
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
                  <p>No lesson plans found in your library.</p>
                  <p className="text-sm mt-2">Visit the Lesson Plans page to create lesson plans first.</p>
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
                Attach {selectedMaterials.length} Plan{selectedMaterials.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}