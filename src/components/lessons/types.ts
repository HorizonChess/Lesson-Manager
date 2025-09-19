export interface RecurringLessonsFormState {
  groupId: string
  weeks: number
  startDate: string
  endDate: string
  template: 'semester' | 'year' | 'custom'
  editingPatternId: string
  newDay: string
  newStartTime: string
  newEndTime: string
}

export interface RecurringPattern {
  id: string
  groupId: string
  groupName: string
  schoolName: string
  subjectName: string
  day: string
  time: string
  lessonIds: string[]
  lessonsCount: number
  startDate: string
  endDate: string
}
