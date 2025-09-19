import { useState, useEffect } from 'react'
import type { GroupWithDetails } from '../../services/lessonsPage'

interface LessonsAddLessonModalProps {
  isOpen: boolean
  groups: GroupWithDetails[]
  initialValues?: {
    groupId?: string
    date?: string
    startTime?: string
    endTime?: string
  }
  onClose: () => void
  onSubmit: (formData: {
    groupId: string
    date: string
    startTime: string
    endTime: string
  }) => void
}

export function LessonsAddLessonModal({
  isOpen,
  groups,
  initialValues,
  onClose,
  onSubmit
}: LessonsAddLessonModalProps) {
  const [selectedGroup, setSelectedGroup] = useState(initialValues?.groupId || '')
  const [lessonDate, setLessonDate] = useState(initialValues?.date || '')
  const [startTime, setStartTime] = useState(initialValues?.startTime || '')
  const [endTime, setEndTime] = useState(initialValues?.endTime || '')

  // Update form when initial values change
  useEffect(() => {
    if (initialValues) {
      setSelectedGroup(initialValues.groupId || '')
      setLessonDate(initialValues.date || '')
      setStartTime(initialValues.startTime || '')
      setEndTime(initialValues.endTime || '')
    }
  }, [initialValues])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup || !lessonDate || !startTime || !endTime) return

    onSubmit({
      groupId: selectedGroup,
      date: lessonDate,
      startTime,
      endTime
    })

    // Reset form
    setSelectedGroup('')
    setLessonDate('')
    setStartTime('')
    setEndTime('')
  }

  const handleCancel = () => {
    setSelectedGroup('')
    setLessonDate('')
    setStartTime('')
    setEndTime('')
    onClose()
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            onClick={handleCancel}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}