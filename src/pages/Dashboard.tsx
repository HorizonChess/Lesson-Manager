import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { israeliCalendar } from '../services/israeliCalendar'
import { ScheduleWizard } from '../components/ScheduleWizard'
import { Button } from '../components/ui/button'
import type { Task, Material } from '../types/database'
import {
  fetchDashboardCounts,
  fetchLessonsBetween,
  fetchLessonsForDay,
  fetchOpenTasks,
  fetchRecentMaterials as fetchRecentMaterialsService
} from '../services/dashboard'

interface DashboardStats {
  schools: number
  subjects: number
  groups: number
  totalLessons: number
  completedLessons: number
  pendingTasks: number
  thisWeekLessons: number
}

interface TodayLesson {
  id: string
  start_time: string
  end_time: string
  group: {
    name: string
    school: { name: string }
    subject: { name: string }
  }
  is_cancelled: boolean
}

export function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    schools: 0,
    subjects: 0,
    groups: 0,
    totalLessons: 0,
    completedLessons: 0,
    pendingTasks: 0,
    thisWeekLessons: 0
  })
  const [todayLessons, setTodayLessons] = useState<TodayLesson[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([])

  // Calendar update prompt state
  const [calendarUpdateNeeded, setCalendarUpdateNeeded] = useState<{needsUpdate: boolean, missingYear: string}>({needsUpdate: false, missingYear: ''})
  const [showCalendarPrompt, setShowCalendarPrompt] = useState(false)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  // Check for calendar update needs
  useEffect(() => {
    const updateCheck = israeliCalendar.checkForUpdateNeeded()
    setCalendarUpdateNeeded(updateCheck)

    // Auto-show prompt if update is needed and not already dismissed
    if (updateCheck.needsUpdate && !localStorage.getItem(`calendar-prompt-dismissed-${updateCheck.missingYear}`)) {
      setShowCalendarPrompt(true)
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchStats(),
        fetchTodayLessons(),
        fetchRecentTasks(),
        fetchRecentMaterials()
      ])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!user) return

    const today = new Date()
    const startOfWeek = new Date(today)
    const dayOfWeek = today.getDay()

    if (dayOfWeek === 6) {
      startOfWeek.setDate(today.getDate() + 1)
    } else {
      startOfWeek.setDate(today.getDate() - dayOfWeek)
    }
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 5)
    endOfWeek.setHours(23, 59, 59, 999)

    const [counts, weekLessons] = await Promise.all([
      fetchDashboardCounts(user.id),
      fetchLessonsBetween(startOfWeek.toISOString(), endOfWeek.toISOString())
    ])

    setStats({
      schools: counts.schools,
      subjects: counts.subjects,
      groups: counts.groups,
      totalLessons: counts.lessons,
      completedLessons: counts.lessonRecords,
      pendingTasks: counts.openTasks,
      thisWeekLessons: weekLessons.length
    })
  }

  const fetchTodayLessons = async () => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(startOfDay.getDate() + 1)

    const lessons = await fetchLessonsForDay(startOfDay.toISOString(), endOfDay.toISOString())

    setTodayLessons(lessons.map(lesson => ({
      id: lesson.id,
      start_time: lesson.start_time,
      end_time: lesson.end_time,
      is_cancelled: lesson.is_cancelled,
      group: {
        name: lesson.group_name,
        school: { name: lesson.school_name },
        subject: { name: lesson.subject_name }
      }
    })))
  }

  const fetchRecentTasks = async () => {
    const tasks = await fetchOpenTasks(3)
    setRecentTasks(tasks)
  }

  const fetchRecentMaterials = async () => {
    const materials = await fetchRecentMaterialsService(3)
    setRecentMaterials(materials)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading dashboard: {error}
      </div>
    )
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const dismissCalendarPrompt = () => {
    setShowCalendarPrompt(false)
    // Remember dismissal for this year so we don't show again
    localStorage.setItem(`calendar-prompt-dismissed-${calendarUpdateNeeded.missingYear}`, 'true')
  }

  const showCalendarUpdateInstructions = () => {
    const template = israeliCalendar.generateYearTemplate(calendarUpdateNeeded.missingYear)
    const templateJson = JSON.stringify(template, null, 2)

    alert(`Calendar Update Needed for ${calendarUpdateNeeded.missingYear}

Please follow these steps:

1. Visit the official vacation calendar: https://www.gov.il/he/pages/vacations25-26
2. Open the file: src/data/israeliVacations.json
3. Add the following template and replace DD/MM/YYYY with real dates:

${templateJson}

4. Save the file and the app will automatically use the new calendar data!`)

    dismissCalendarPrompt()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <ScheduleWizard />
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.email?.split('@')[0]}
          </p>
        </div>
      </div>

      {/* Calendar Update Prompt */}
      {showCalendarPrompt && calendarUpdateNeeded.needsUpdate && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Calendar Update Required
              </h3>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                School year {calendarUpdateNeeded.missingYear} vacation calendar is missing. Please update the calendar data to ensure accurate lesson scheduling.
              </p>
              <div className="mt-3 flex space-x-3">
                <Button
                  onClick={showCalendarUpdateInstructions}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Show Update Instructions
                </Button>
                <Button
                  onClick={dismissCalendarPrompt}
                  variant="outline"
                >
                  Dismiss for Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Overview */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Today's Schedule</h2>
        {todayLessons.length > 0 ? (
          <div className="space-y-3">
            {todayLessons.map(lesson => (
              <div
                key={lesson.id}
                className={`flex items-center justify-between p-3 rounded border ${
                  lesson.is_cancelled
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                }`}
              >
                <div>
                  <div className="font-medium">
                    {lesson.group.school.name} - {lesson.group.subject.name}
                  </div>
                  <div className="text-sm">{lesson.group.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                  </div>
                  {lesson.is_cancelled && (
                    <div className="text-xs text-red-600 dark:text-red-400">Cancelled</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No lessons scheduled for today</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.schools}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Schools</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.groups}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Groups</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.thisWeekLessons}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">This Week</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending Tasks</div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/schools"
          className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">School Overview</h3>
            <div className="text-blue-600">→</div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stats.schools} schools, {stats.subjects} subjects
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Manage structure & groups
          </p>
        </Link>

        <Link
          to="/lessons"
          className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Lessons</h3>
            <div className="text-green-600">→</div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stats.completedLessons} of {stats.totalLessons} with records
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Schedule & lesson records
          </p>
        </Link>

        <Link
          to="/tasks"
          className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Tasks</h3>
            <div className="text-orange-600">→</div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stats.pendingTasks} pending
          </p>
          {recentTasks.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              Latest: {recentTasks[0].title}
            </p>
          )}
        </Link>

        <Link
          to="/lesson-plans"
          className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Lesson Plans</h3>
            <div className="text-purple-600">→</div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {recentMaterials.length} recent plans
          </p>
          {recentMaterials.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              Latest: {recentMaterials[0].title}
            </p>
          )}
        </Link>
      </div>

      {/* Recent Activity */}
      {(recentTasks.length > 0 || recentMaterials.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recentTasks.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Recent Tasks</h3>
              <div className="space-y-2">
                {recentTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{task.title}</span>
                    <Link
                      to="/tasks"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs ml-2"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentMaterials.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Recent Lesson Plans</h3>
              <div className="space-y-2">
                {recentMaterials.map(material => (
                  <div key={material.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{material.title}</span>
                    <Link
                      to="/lesson-plans"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs ml-2"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
