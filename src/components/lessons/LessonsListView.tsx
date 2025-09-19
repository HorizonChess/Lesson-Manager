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
      <div className="text-center py-8 text-gray-500">
        No lessons yet. Add individual lessons or generate recurring lessons from your groups!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedLessons).map(([date, dayLessons]) => (
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
                      onClick={() => onOpenLessonRecord(lesson.id)}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      View Lesson
                    </button>
                    <button
                      onClick={() => onToggleLessonCancellation(lesson.id, lesson.is_cancelled)}
                      className={`px-2 py-1 rounded text-xs ${
                        lesson.is_cancelled
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-yellow-600 text-white hover:bg-yellow-700'
                      }`}
                    >
                      {lesson.is_cancelled ? 'Restore' : 'Cancel'}
                    </button>
                    <button
                      onClick={() => onDeleteLesson(lesson.id)}
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
      ))}
    </div>
  )
}
