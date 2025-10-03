export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface School {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface SchoolSubject {
  id: string
  school_id: string
  subject_id: string
  created_at: string
}

export interface Group {
  id: string
  school_id: string
  subject_id: string
  name: string
  timeslots: any[]
  created_at: string
  updated_at: string
}

export interface RosterItem {
  id: string
  group_id: string
  student_name: string
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  group_id: string
  start_time: string
  end_time: string
  is_cancelled: boolean
  created_at: string
  updated_at: string
}

export interface LessonRecord {
  id: string
  lesson_id: string
  covered: string | null
  planned: string | null
  homework: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  lesson_record_id: string
  roster_item_id: string
  status: 'present' | 'absent' | 'late'
  note: string | null
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  user_id: string
  title: string
  description: string | null
  file_url: string | null
  created_at: string
  updated_at: string
}

export interface LessonMaterial {
  id: string
  lesson_record_id: string
  material_id: string
  created_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  subject_id: string | null  // null for "General" tags
  created_at: string
  updated_at: string
}

export interface MaterialTag {
  id: string
  material_id: string
  tag_id: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  is_completed: boolean
  group_id: string | null
  lesson_id: string | null
  created_at: string
  updated_at: string
}