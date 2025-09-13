import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Lesson, Group } from '../types/database'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [lessonDate, setLessonDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  // View states
  const [viewMode, setViewMode] = useState<'upcoming' | 'all'>('upcoming')

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

      setGroups(groupsData || [])
      setLessons(lessonsData || [])
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
    } catch (err: any) {
      setError(err.message)
    }
  }

  const filteredLessons = viewMode === 'upcoming'
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
            onClick={() => setViewMode(viewMode === 'upcoming' ? 'all' : 'upcoming')}
            className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 text-sm"
          >
            {viewMode === 'upcoming' ? 'Show All' : 'Show Upcoming'}
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
    </div>
  )
}