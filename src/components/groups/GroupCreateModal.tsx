import { useEffect, useState } from 'react'
import { Modal } from '../Modal'
import { Button } from '../ui/button'
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

  // Note: Subjects are now global. Filtering by school requires school_subjects junction data.
  // For now, show all subjects. The user can select which subject to assign to this group.
  const availableSubjects = subjects

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
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm()
        onClose()
      }}
      title="Create new group"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-4">
        <p className="text-sm text-soft-muted">
          Set up the basics now and refine details later.
        </p>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            <span className="text-soft">Group name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Grade 7 - Advanced"
              className="surface-input rounded-md px-3 py-2 text-sm"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            <span className="text-soft">School</span>
            <select
              value={schoolId}
              onChange={(event) => setSchoolId(event.target.value)}
              className="surface-input rounded-md px-3 py-2 text-sm"
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

          <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
            <span className="text-soft">Subject</span>
            <select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              className="surface-input rounded-md px-3 py-2 text-sm"
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
            <h3 className="text-sm font-semibold">Weekly schedule</h3>
            <Button
              type="button"
              onClick={addTimeslot}
              variant="ghost"
              size="sm"
            >
              Add timeslot
            </Button>
          </div>

          {timeslots.length === 0 ? (
            <p className="text-sm italic text-soft-muted">
              No schedule yet. Add timeslots to capture recurring meetings.
            </p>
          ) : (
            <div className="space-y-3">
              {timeslots.map((slot, index) => (
                <div key={`slot-${index}`} className="grid gap-3 sm:grid-cols-[1fr,1fr,1fr,auto]">
                  <select
                    value={slot.day}
                    onChange={(event) => handleTimeslotChange(index, 'day', event.target.value)}
                    className="surface-input rounded-md px-3 py-2 text-sm"
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
                    className="surface-input rounded-md px-3 py-2 text-sm"
                  />

                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(event) => handleTimeslotChange(index, 'endTime', event.target.value)}
                    className="surface-input rounded-md px-3 py-2 text-sm"
                  />

                  {timeslots.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeTimeslot(index)}
                      variant="ghost"
                      size="sm"
                      className="self-center text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
          <Button
            type="button"
            onClick={() => {
              resetForm()
              onClose()
            }}
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create group'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
