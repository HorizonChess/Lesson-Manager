import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import moment from 'moment'
import { israeliCalendar } from '../services/israeliCalendar'
import { ScheduleWizard } from '../components/ScheduleWizard'
import { Button } from '../components/ui/button'
import { QuickAttendanceModal } from '../components/dashboard/QuickAttendanceModal'
import { LessonsRecordModal } from '../components/lessons/LessonsRecordModal'
import { LessonMaterialSelector } from '../components/lessons/LessonMaterialSelector'
import type { Task, Material } from '../types/database'
import type { NormalizedLesson } from '../services/lessonsPage'
import {
  fetchDashboardCounts,
  fetchLessonsBetween,
  fetchTodayLessonsWithAttendance,
  fetchOpenTasks,
  fetchRecentMaterials as fetchRecentMaterialsService,
  type TodayLessonWithAttendance
} from '../services/dashboard'
import { updateLessonRecord, upsertAttendance, replaceAttendance, updateLessonTime } from '../services/lessonsMutations'
import {
  fetchAllUserMaterials,
  fetchLessonMaterials,
  attachMaterialsToLesson,
  removeMaterialFromLesson
} from '../services/lessonMaterials'

interface DashboardStats {
  schools: number
  subjects: number
  groups: number
  totalLessons: number
  completedLessons: number
  pendingTasks: number
  thisWeekLessons: number
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
  const [todayLessons, setTodayLessons] = useState<TodayLessonWithAttendance[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([])
  const [allMaterials, setAllMaterials] = useState<Material[]>([])
  const [lessonMaterials, setLessonMaterials] = useState<Record<string, Material[]>>({})

  // Quick attendance modal state
  const [quickAttendanceOpen, setQuickAttendanceOpen] = useState(false)
  const [selectedLessonForAttendance, setSelectedLessonForAttendance] = useState<TodayLessonWithAttendance | null>(null)

  // Full lesson record modal state
  const [fullRecordOpen, setFullRecordOpen] = useState(false)
  const [selectedLessonForFullRecord, setSelectedLessonForFullRecord] = useState<TodayLessonWithAttendance | null>(null)

  // Material selector modal state
  const [showMaterialSelector, setShowMaterialSelector] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])

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
        fetchRecentMaterials(),
        fetchAllMaterials()
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

    const lessons = await fetchTodayLessonsWithAttendance(startOfDay.toISOString(), endOfDay.toISOString())
    setTodayLessons(lessons)
  }

  const handleOpenQuickAttendance = (lesson: TodayLessonWithAttendance) => {
    setSelectedLessonForAttendance(lesson)
    setQuickAttendanceOpen(true)
  }

  const handleOpenFullRecord = async (lesson: TodayLessonWithAttendance) => {
    setSelectedLessonForFullRecord(lesson)
    setFullRecordOpen(true)

    // Fetch materials for this lesson if it has a lesson record
    if (lesson.lesson_record_id) {
      const materials = await fetchLessonMaterials(lesson.lesson_record_id)

      setLessonMaterials(prev => ({
        ...prev,
        [lesson.lesson_record_id!]: materials  // Use lesson_record_id as key
      }))
    }
  }

  const handleAttendanceSuccess = async () => {
    // Refresh today's lessons to show updated attendance data
    await fetchTodayLessons()
  }

  const fetchRecentTasks = async () => {
    const tasks = await fetchOpenTasks(3)
    setRecentTasks(tasks)
  }

  const fetchRecentMaterials = async () => {
    const materials = await fetchRecentMaterialsService(3)
    setRecentMaterials(materials)
  }

  const fetchAllMaterials = async () => {
    if (!user) return

    const materials = await fetchAllUserMaterials(user.id)
    setAllMaterials(materials)
  }

  const openMaterialSelector = async (lessonRecordId: string) => {
    // Fetch materials for this lesson record
    const currentMaterials = await fetchLessonMaterials(lessonRecordId)

    setSelectedMaterials(currentMaterials.map(m => m.id))
    setShowMaterialSelector(true)
  }

  const removeMaterial = async (lessonRecordId: string, materialId: string) => {
    await removeMaterialFromLesson(lessonRecordId, materialId)

    // Update local state - lessonRecordId is already the correct key
    setLessonMaterials(prev => {
      const updated = { ...prev }
      if (updated[lessonRecordId]) {
        updated[lessonRecordId] = updated[lessonRecordId].filter(m => m.id !== materialId)
      }
      return updated
    })
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:gap-4">
          <p className="text-sm sm:text-base text-soft">
            Welcome back, {user?.email?.split('@')[0]}
          </p>
          <ScheduleWizard />
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
      <div className="surface-panel p-6">
        <h2 className="text-lg font-semibold mb-4">Today's Schedule</h2>
        {todayLessons.length > 0 ? (
          <div className="space-y-3">
            {todayLessons.map(lesson => (
              <div
                key={lesson.id}
                className={`surface-body p-4 rounded-lg border ${
                  lesson.is_cancelled
                    ? 'border-red-200 dark:border-red-800'
                    : lesson.has_attendance
                    ? 'border-green-200 dark:border-green-800'
                    : 'border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base">
                      {lesson.school_name} - {lesson.subject_name}
                    </div>
                    <div className="text-sm text-soft mt-0.5">{lesson.group_name}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-medium text-sm">
                      {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                    </div>
                    {lesson.is_cancelled ? (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">Cancelled</div>
                    ) : lesson.has_attendance ? (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                        ✓ {lesson.attendance_count}/{lesson.roster_count} ({lesson.attendance_percentage}%)
                      </div>
                    ) : (
                      <div className="text-xs text-soft-muted mt-1">No attendance yet</div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {!lesson.is_cancelled && (
                  <div className="flex gap-2 pt-3 border-t border-white/10">
                    <Button
                      size="sm"
                      onClick={() => handleOpenQuickAttendance(lesson)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={lesson.roster_count === 0}
                    >
                      {lesson.roster_count === 0
                        ? 'No Students'
                        : lesson.has_attendance
                        ? 'Update Attendance'
                        : 'Mark Attendance'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenFullRecord(lesson)}
                      className="flex-1"
                    >
                      Full Record
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-soft">No lessons scheduled for today</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="surface-panel p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.schools}</div>
          <div className="text-sm text-soft">Schools</div>
        </div>
        <div className="surface-panel p-4">
          <div className="text-2xl font-bold text-green-600">{stats.groups}</div>
          <div className="text-sm text-soft">Groups</div>
        </div>
        <div className="surface-panel p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.thisWeekLessons}</div>
          <div className="text-sm text-soft">This Week</div>
        </div>
        <div className="surface-panel p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</div>
          <div className="text-sm text-soft">Pending Tasks</div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/schools"
          className="surface-panel p-4 transition-colors hover:bg-white/30 dark:hover:bg-white/15"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">School Overview</h3>
            <div className="text-blue-600">→</div>
          </div>
          <p className="text-sm text-soft">
            {stats.schools} schools, {stats.subjects} subjects
          </p>
          <p className="text-xs text-soft-muted mt-2">
            Manage structure & groups
          </p>
        </Link>

        <Link
          to="/lessons"
          className="surface-panel p-4 transition-colors hover:bg-white/30 dark:hover:bg-white/15"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Lessons</h3>
            <div className="text-green-600">→</div>
          </div>
          <p className="text-sm text-soft">
            {stats.completedLessons} of {stats.totalLessons} with records
          </p>
          <p className="text-xs text-soft-muted mt-2">
            Schedule & lesson records
          </p>
        </Link>

        <Link
          to="/tasks"
          className="surface-panel p-4 transition-colors hover:bg-white/30 dark:hover:bg-white/15"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Tasks</h3>
            <div className="text-orange-600">→</div>
          </div>
          <p className="text-sm text-soft">
            {stats.pendingTasks} pending
          </p>
          {recentTasks.length > 0 && (
            <p className="text-xs text-soft-muted mt-1 truncate">
              Latest: {recentTasks[0].title}
            </p>
          )}
        </Link>

        <Link
          to="/lesson-plans"
          className="surface-panel p-4 transition-colors hover:bg-white/30 dark:hover:bg-white/15"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Lesson Plans</h3>
            <div className="text-purple-600">→</div>
          </div>
          <p className="text-sm text-soft">
            {recentMaterials.length} recent plans
          </p>
          {recentMaterials.length > 0 && (
            <p className="text-xs text-soft-muted mt-1 truncate">
              Latest: {recentMaterials[0].title}
            </p>
          )}
        </Link>
      </div>

      {/* Recent Activity */}
      {(recentTasks.length > 0 || recentMaterials.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recentTasks.length > 0 && (
            <div className="surface-panel p-4">
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
            <div className="surface-panel p-4">
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

      {/* Quick Attendance Modal */}
      {selectedLessonForAttendance && (
        <QuickAttendanceModal
          isOpen={quickAttendanceOpen}
          lessonId={selectedLessonForAttendance.id}
          lessonTitle={`${selectedLessonForAttendance.school_name} - ${selectedLessonForAttendance.subject_name}`}
          lessonDate={new Date(selectedLessonForAttendance.start_time).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
          lessonTime={`${formatTime(selectedLessonForAttendance.start_time)} - ${formatTime(selectedLessonForAttendance.end_time)}`}
          roster={selectedLessonForAttendance.roster}
          initialAttendance={selectedLessonForAttendance.attendance}
          onClose={() => {
            setQuickAttendanceOpen(false)
            setSelectedLessonForAttendance(null)
          }}
          onSuccess={handleAttendanceSuccess}
        />
      )}

      {/* Full Lesson Record Modal */}
      {selectedLessonForFullRecord && (
        <LessonsRecordModal
          isOpen={fullRecordOpen}
          openLessonRecord={selectedLessonForFullRecord.id}
          lessons={[{
            id: selectedLessonForFullRecord.id,
            start_time: selectedLessonForFullRecord.start_time,
            end_time: selectedLessonForFullRecord.end_time,
            is_cancelled: selectedLessonForFullRecord.is_cancelled,
            group_id: selectedLessonForFullRecord.group_id,
            group: {
              name: selectedLessonForFullRecord.group_name,
              school: { name: selectedLessonForFullRecord.school_name },
              subject: { name: selectedLessonForFullRecord.subject_name }
            }
          } as NormalizedLesson]}
          lessonRecords={selectedLessonForFullRecord.lesson_record_id ? {
            [selectedLessonForFullRecord.id]: {
              id: selectedLessonForFullRecord.lesson_record_id,
              lesson_id: selectedLessonForFullRecord.id,
              covered: selectedLessonForFullRecord.lesson_record_covered || '',
              planned: selectedLessonForFullRecord.lesson_record_planned || '',
              homework: selectedLessonForFullRecord.lesson_record_homework || '',
              notes: selectedLessonForFullRecord.lesson_record_notes || '',
              created_at: '',
              updated_at: ''
            }
          } : {}}
          initialRecordData={{
            covered: selectedLessonForFullRecord.lesson_record_covered || '',
            planned: selectedLessonForFullRecord.lesson_record_planned || '',
            homework: selectedLessonForFullRecord.lesson_record_homework || '',
            notes: selectedLessonForFullRecord.lesson_record_notes || ''
          }}
          previousLessonData={null}
          groupRoster={selectedLessonForFullRecord.roster}
          attendance={selectedLessonForFullRecord.attendance}
          lessonMaterials={lessonMaterials}
          onClose={() => {
            setFullRecordOpen(false)
            setSelectedLessonForFullRecord(null)
          }}
          onUpdateLessonTime={async (lessonId, date, startTime, endTime) => {
            const newStartDateTime = moment(`${date} ${startTime}`)
            const newEndDateTime = moment(`${date} ${endTime}`)

            if (!newStartDateTime.isValid() || !newEndDateTime.isValid()) {
              alert('Invalid date or time format')
              return
            }

            if (newEndDateTime.isBefore(newStartDateTime)) {
              alert('End time must be after start time')
              return
            }

            await updateLessonTime(
              lessonId,
              newStartDateTime.toISOString(),
              newEndDateTime.toISOString()
            )

            await fetchTodayLessons()
            alert('Lesson time updated successfully!')
          }}
          onSaveRecord={async (data) => {
            if (!selectedLessonForFullRecord.id) return

            await updateLessonRecord({
              lessonId: selectedLessonForFullRecord.id,
              covered: data.covered,
              planned: data.planned,
              homework: data.homework,
              notes: data.notes
            })

            // Update the selected lesson with the saved data to prevent modal from reverting
            setSelectedLessonForFullRecord({
              ...selectedLessonForFullRecord,
              lesson_record_covered: data.covered,
              lesson_record_planned: data.planned,
              lesson_record_homework: data.homework,
              lesson_record_notes: data.notes
            })

            await fetchTodayLessons()
          }}
          onMarkAllAttendance={async (status) => {
            if (!selectedLessonForFullRecord.lesson_record_id) return

            await replaceAttendance({
              lessonRecordId: selectedLessonForFullRecord.lesson_record_id,
              records: selectedLessonForFullRecord.roster.map(student => ({
                rosterItemId: student.id,
                status,
                note: null
              }))
            })

            await fetchTodayLessons()
          }}
          onUpdateStudentAttendance={async (studentId, status, note) => {
            if (!selectedLessonForFullRecord.lesson_record_id) return

            await upsertAttendance({
              lessonRecordId: selectedLessonForFullRecord.lesson_record_id,
              rosterItemId: studentId,
              status,
              note: note || null
            })

            await fetchTodayLessons()
          }}
          onSaveAttendanceNote={async (studentId, note) => {
            if (!selectedLessonForFullRecord.lesson_record_id) return

            const existingAttendance = selectedLessonForFullRecord.attendance[studentId]
            const currentStatus = existingAttendance?.status || 'present'

            await upsertAttendance({
              lessonRecordId: selectedLessonForFullRecord.lesson_record_id,
              rosterItemId: studentId,
              status: currentStatus,
              note: note || null
            })

            await fetchTodayLessons()
          }}
          onOpenMaterialSelector={openMaterialSelector}
          onRemoveMaterial={removeMaterial}
        />
      )}

      {/* Material Selector Modal */}
      <LessonMaterialSelector
        isOpen={showMaterialSelector}
        materials={allMaterials}
        selectedMaterialIds={selectedMaterials}
        onClose={() => {
          setShowMaterialSelector(false)
          setSelectedMaterials([])
        }}
        onAttach={async (materialIds) => {
          if (!selectedLessonForFullRecord?.lesson_record_id) return

          const lessonRecordId = selectedLessonForFullRecord.lesson_record_id

          // Attach materials using service layer
          await attachMaterialsToLesson(lessonRecordId, materialIds)

          // Update local state with attached materials
          const attachedMaterials = allMaterials.filter(m => materialIds.includes(m.id))
          setLessonMaterials(prev => ({
            ...prev,
            [lessonRecordId]: attachedMaterials
          }))

          setShowMaterialSelector(false)
        }}
      />
    </div>
  )
}
