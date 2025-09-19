import moment from 'moment'
import type { Dispatch, SetStateAction } from 'react'
import type { GroupWithDetails } from '../../services/lessonsPage'
import type { RecurringLessonsFormState, RecurringPattern } from './types'

interface RecurringLessonsModalProps {
  isOpen: boolean
  groups: GroupWithDetails[]
  formData: RecurringLessonsFormState
  setFormData: Dispatch<SetStateAction<RecurringLessonsFormState>>
  showCreateForm: boolean
  onShowCreateFormChange: (value: boolean) => void
  patterns: RecurringPattern[]
  onClose: () => void
  onGenerateLessons: (payload: {
    groupId: string
    weeks: number
    day: string
    startTime: string
    endTime: string
  }) => Promise<void> | void
  onUpdatePattern: (payload: {
    lessonIds: string[]
    newDay: string
    newStartTime: string
    newEndTime: string
  }) => Promise<void>
  onDeletePattern: (pattern: RecurringPattern) => Promise<void>
}

export function RecurringLessonsModal({
  isOpen,
  groups,
  formData,
  setFormData,
  showCreateForm,
  onShowCreateFormChange,
  patterns,
  onClose,
  onGenerateLessons,
  onUpdatePattern,
  onDeletePattern
}: RecurringLessonsModalProps) {
  if (!isOpen) {
    return null
  }

  const updateForm = (patch: Partial<RecurringLessonsFormState>) => {
    setFormData((prev) => ({ ...prev, ...patch }))
  }

  const selectedGroup = groups.find((group) => group.id === formData.groupId)
  const groupPatterns = patterns.filter((pattern) => pattern.groupId === formData.groupId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Manage Recurring Lessons</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xl text-gray-500 transition hover:text-gray-700"
          >
            x
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">Select Group</label>
              <select
                value={formData.groupId}
                onChange={(event) => updateForm({ groupId: event.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                required
              >
                <option value="">Choose a group...</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({(group as any).school?.name} / {(group as any).subject?.name})
                  </option>
                ))}
              </select>
            </div>

            {formData.groupId && (
              <div className="space-y-4">
                <div className="rounded bg-gray-50 p-3 dark:bg-gray-700">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{selectedGroup?.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {(selectedGroup as any)?.school?.name} / {(selectedGroup as any)?.subject?.name}
                  </div>
                </div>

                {groupPatterns.length > 0 && (
                  <div>
                    <h4 className="mb-3 font-semibold text-blue-700 dark:text-blue-300">Existing Recurring Lessons</h4>
                    <div className="space-y-3">
                      {groupPatterns.map((pattern) => (
                        <div key={pattern.id} className="rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <div className="font-medium text-blue-900 dark:text-blue-100">
                                {pattern.day} {pattern.time}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                {pattern.lessonsCount} lessons / {moment(pattern.startDate).format('MMM D')} - {moment(pattern.endDate).format('MMM D, YYYY')}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                updateForm({
                                  editingPatternId: formData.editingPatternId === pattern.id ? '' : pattern.id,
                                  newDay: pattern.day,
                                  newStartTime: pattern.time.split('-')[0],
                                  newEndTime: pattern.time.split('-')[1]
                                })
                              }}
                              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                            >
                              {formData.editingPatternId === pattern.id ? 'Cancel' : 'Edit'}
                            </button>
                          </div>

                          {formData.editingPatternId === pattern.id && (
                            <div className="space-y-3 rounded border bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
                              <h5 className="text-sm font-medium">Update Timeslot</h5>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="mb-1 block text-xs font-medium">Day</label>
                                  <select
                                    value={formData.newDay}
                                    onChange={(event) => updateForm({ newDay: event.target.value })}
                                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                                  >
                                    <option value="Sunday">Sunday</option>
                                    <option value="Monday">Monday</option>
                                    <option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option>
                                    <option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option>
                                    <option value="Saturday">Saturday</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium">Start Time</label>
                                  <input
                                    type="time"
                                    value={formData.newStartTime}
                                    onChange={(event) => updateForm({ newStartTime: event.target.value })}
                                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium">End Time</label>
                                  <input
                                    type="time"
                                    value={formData.newEndTime}
                                    onChange={(event) => updateForm({ newEndTime: event.target.value })}
                                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await onUpdatePattern({
                                      lessonIds: pattern.lessonIds,
                                      newDay: formData.newDay,
                                      newStartTime: formData.newStartTime,
                                      newEndTime: formData.newEndTime
                                    })
                                    updateForm({ editingPatternId: '' })
                                  }}
                                  className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                                >
                                  Update All {pattern.lessonsCount} Lessons
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const confirmed = window.confirm(
                                      `Are you sure you want to delete this recurring pattern?\n\nThis will delete all ${pattern.lessonsCount} lessons from ${moment(pattern.startDate).format('MMM D')} to ${moment(pattern.endDate).format('MMM D, YYYY')}.`
                                    )
                                    if (!confirmed) return
                                    await onDeletePattern(pattern)
                                    updateForm({ editingPatternId: '' })
                                  }}
                                  className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                                >
                                  Delete Pattern
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateForm({ editingPatternId: '' })}
                                  className="rounded bg-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded border border-dashed border-gray-300 p-3 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => onShowCreateFormChange(!showCreateForm)}
                    className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    {showCreateForm ? 'Hide creation form' : 'Create new recurring lessons'}
                  </button>

                  {showCreateForm && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Preset</label>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          {[
                            { label: 'Semester', value: 'semester' as const, weeks: 12 },
                            { label: 'Full Year', value: 'year' as const, weeks: 40 },
                            { label: 'Custom', value: 'custom' as const, weeks: formData.weeks }
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => updateForm({ template: option.value, weeks: option.weeks })}
                              className={`rounded border px-3 py-2 transition ${
                                formData.template === option.value
                                  ? 'border-green-500 bg-green-100 text-green-700'
                                  : 'border-gray-300 bg-white hover:bg-gray-50'
                              }`}
                            >
                              {option.label}
                              {option.value !== 'custom' && (
                                <span className="block text-xs text-gray-500">{option.weeks} weeks</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium">Start Date</label>
                          <input
                            type="date"
                            value={formData.startDate}
                            onChange={(event) => updateForm({ startDate: event.target.value })}
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">End Date</label>
                          <input
                            type="date"
                            value={formData.endDate}
                            onChange={(event) => updateForm({ endDate: event.target.value })}
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                            placeholder="Optional"
                          />
                        </div>
                      </div>

                      {formData.template === 'custom' && (
                        <div>
                          <label className="mb-1 block text-sm font-medium">Number of Weeks</label>
                          <input
                            type="number"
                            min={1}
                            max={52}
                            value={formData.weeks}
                            onChange={(event) => updateForm({ weeks: parseInt(event.target.value, 10) || 1 })}
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!formData.groupId) return
                            await onGenerateLessons({
                              groupId: formData.groupId,
                              weeks: formData.weeks,
                              day: formData.newDay,
                              startTime: formData.newStartTime,
                              endTime: formData.newEndTime
                            })
                            onShowCreateFormChange(false)
                          }}
                          disabled={!formData.groupId}
                          className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Create {formData.weeks} Week{formData.weeks !== 1 ? 's' : ''}
                        </button>
                        <button
                          type="button"
                          onClick={() => onShowCreateFormChange(false)}
                          className="rounded bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end border-t px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
