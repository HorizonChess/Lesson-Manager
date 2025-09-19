import { useEffect, useMemo, useState } from 'react'
import type { School, Subject } from '../../types/database'

interface Timeslot {
  day: string
  startTime: string
  endTime: string
}

interface GroupCreateModalProps {
  isOpen: boolean
  schools: School[]
  subjects: Subject[]
  onClose: () => void
  onCreate: (payload: {
    name: string
    schoolId: string
    subjectId: string
    timeslots: Timeslot[]
  }) => Promise<void>
}

const emptyTimeslot: Timeslot = { day: '', startTime: '', endTime: '' }

const dayOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function GroupCreateModal({ isOpen, schools, subjects, onClose, onCreate }: GroupCreateModalProps) {
  const [schoolId, setSchoolId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [name, setName] = useState('')
  const [timeslots, setTimeslots] = useState<Timeslot[]>([emptyTimeslot])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableSubjects = useMemo(
    () => subjects.filter(subject => subject.school_id === schoolId),
    [subjects, schoolId]
  )

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  useEffect(() => {
    setSubjectId('')
  }, [schoolId])

  const resetForm = () => {
    setSchoolId('')
    setSubjectId('')
    setName('')
    setTimeslots([emptyTimeslot])
    setIsSubmitting(false)
    setError(null)
  }

  if (!isOpen) {
    return null
  }

  const handleTimeslotChange = (index: number, field: keyof Timeslot, value: string) => {
    setTimeslots((prev) =>
      prev.map((slot, slotIndex) => (
        slotIndex === index ? { ...slot, [field]: value } : slot
      ))
    )
  }

  const addTimeslot = () => {
    setTimeslots((prev) => [...prev, { ...emptyTimeslot }])
  }

  const removeTimeslot = (index: number) => {
    setTimeslots((prev) => prev.filter((_, slotIndex) => slotIndex !== index))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!name.trim() || !schoolId || !subjectId) {
      setError('Please fill in group name, school, and subject.')
      return
    }

    const sanitizedTimeslots = timeslots
      .filter((slot) => slot.day && slot.startTime && slot.endTime)
      .map((slot) => ({ ...slot }))

    setIsSubmitting(true)
    setError(null)

    try {
      await onCreate({
        name: name.trim(),
        schoolId,
        subjectId,
        timeslots: sanitizedTimeslots
      })
      resetForm()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to create group.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="border-b px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create new group</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Set up the basics now and refine details later.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  onClose()
                }}
                className="text-gray-400 transition hover:text-gray-600 focus:outline-none"
                aria-label="Close"
              >
                x
              </button>
            </div>
            {error && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
                {error}
              </div>
            )}
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Group name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g., Grade 7 - Advanced"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                School
                <select
                  value={schoolId}
                  onChange={(event) => setSchoolId(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="">Select a school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject
                <select
                  value={subjectId}
                  onChange={(event) => setSubjectId(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  required
                  disabled={!schoolId}
                >
                  <option value="">{schoolId ? 'Select a subject' : 'Choose a school first'}</option>
                  {availableSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Weekly schedule</h3>
                <button
                  type="button"
                  onClick={addTimeslot}
                  className="text-sm font-medium text-blue-600 transition hover:text-blue-700 focus:outline-none"
                >
                  Add timeslot
                </button>
              </div>

              {timeslots.length === 0 ? (
                <p className="text-sm italic text-gray-500 dark:text-gray-400">
                  No schedule yet. Add timeslots to capture recurring meetings.
                </p>
              ) : (
                <div className="space-y-3">
                  {timeslots.map((slot, index) => (
                    <div key={`slot-${index}`} className="grid gap-3 sm:grid-cols-[1fr,1fr,1fr,auto]">
                      <select
                        value={slot.day}
                        onChange={(event) => handleTimeslotChange(index, 'day', event.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                      >
                        <option value="">Day</option>
                        {dayOptions.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>

                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(event) => handleTimeslotChange(index, 'startTime', event.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                      />

                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(event) => handleTimeslotChange(index, 'endTime', event.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                      />

                      {timeslots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeslot(index)}
                          className="self-center rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 transition hover:border-red-300 hover:text-red-600 focus:outline-none dark:border-gray-700 dark:text-gray-300 dark:hover:border-red-500 dark:hover:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t px-6 py-4">
            <button
              type="button"
              onClick={() => {
                resetForm()
                onClose()
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isSubmitting ? 'Creating...' : 'Create group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
