import { Eye, Ban, RotateCcw, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface LessonSummary {
  id: string
  start_time: string
  end_time: string
  is_cancelled: boolean
  group: {
    name: string
    school: { name: string }
    subject: { name: string }
  }
}

interface LessonsListViewProps {
  groupedLessons: Record<string, LessonSummary[]>
  formatDateTime: (dateString: string) => { date: string; time: string }
  onOpenLessonRecord: (lessonId: string) => void
  onToggleLessonCancellation: (lessonId: string, currentStatus: boolean) => void
  onDeleteLesson: (lessonId: string) => void
}

export function LessonsListView({
  groupedLessons,
  formatDateTime,
  onOpenLessonRecord,
  onToggleLessonCancellation,
  onDeleteLesson
}: LessonsListViewProps) {
  if (Object.keys(groupedLessons).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No lessons yet. Add individual lessons or generate recurring lessons from your groups!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {Object.entries(groupedLessons).map(([date, dayLessons], groupIndex) => (
        <motion.div
          key={date}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
          className="surface-panel p-3"
        >
          <h3 className="font-semibold text-base mb-2 border-b dark:border-gray-700 pb-1.5">{date}</h3>
          <div className="space-y-1.5">
            {dayLessons.map((lesson) => {
              const { time: startTime } = formatDateTime(lesson.start_time)
              const { time: endTime } = formatDateTime(lesson.end_time)

              return (
                <div
                  key={lesson.id}
                  className={`flex items-center gap-3 p-2.5 rounded transition-all hover:shadow-sm ${
                    lesson.is_cancelled
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : 'bg-white/15 dark:bg-white/10'
                  }`}
                >
                  <div className={`flex-1 min-w-0 ${lesson.is_cancelled ? 'opacity-60 line-through' : ''}`}>
                    <div className="font-medium text-base truncate">{lesson.group.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {lesson.group.school.name} • {lesson.group.subject.name}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap font-medium flex-shrink-0">
                    {startTime} - {endTime}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => onOpenLessonRecord(lesson.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white p-1.5 rounded transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title="View Lesson"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => onToggleLessonCancellation(lesson.id, lesson.is_cancelled)}
                      className={`p-1.5 rounded transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                        lesson.is_cancelled
                          ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white'
                      }`}
                      title={lesson.is_cancelled ? 'Restore' : 'Cancel'}
                    >
                      {lesson.is_cancelled ? <RotateCcw size={14} /> : <Ban size={14} />}
                    </button>
                    <button
                      onClick={() => onDeleteLesson(lesson.id)}
                      className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white p-1.5 rounded transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
