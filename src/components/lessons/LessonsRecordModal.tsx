import { useState, useEffect } from 'react'
import moment from 'moment'
import { Modal } from '../Modal'
import { Button } from '../ui/button'
import type { Dispatch, SetStateAction } from 'react'
import type { NormalizedLesson } from '../../services/lessonsPage'
import type { Attendance, Material, LessonRecord, RosterItem } from '../../types/database'
import type { LessonRecordData, EditTimeData } from './types'

interface LessonsRecordModalProps {
  isOpen: boolean
  openLessonRecord: string | null
  lessons: NormalizedLesson[]
  lessonRecords: Record<string, LessonRecord>
  initialRecordData: LessonRecordData
  lessonViewMode: 'simple' | 'advanced'
  setLessonViewMode: Dispatch<SetStateAction<'simple' | 'advanced'>>
  isEditingTime: boolean
  setIsEditingTime: Dispatch<SetStateAction<boolean>>
  editTimeData: EditTimeData
  setEditTimeData: Dispatch<SetStateAction<EditTimeData>>
  previousLessonData: LessonRecord | null
  groupRoster: RosterItem[]
  attendance: Record<string, Attendance>
  editingAttendanceNote: string | null
  setEditingAttendanceNote: Dispatch<SetStateAction<string | null>>
  attendanceNoteText: string
  setAttendanceNoteText: Dispatch<SetStateAction<string>>
  bulkAttendanceStatus: 'present' | 'absent' | 'late'
  setBulkAttendanceStatus: Dispatch<SetStateAction<'present' | 'absent' | 'late'>>
  lessonMaterials: Record<string, Material[]>
  onClose: () => void
  onUpdateLessonTime: () => Promise<void>
  onSaveRecord: (data: LessonRecordData) => Promise<void>
  onMarkAllAttendance: (status: 'present' | 'absent' | 'late') => Promise<void>
  onUpdateStudentAttendance: (studentId: string, status: 'present' | 'absent' | 'late', note?: string) => Promise<void>
  onSaveAttendanceNote: (studentId: string) => Promise<void>
  onOpenMaterialSelector: (lessonRecordId: string) => void
  onRemoveMaterial: (lessonRecordId: string, materialId: string) => Promise<void>
}

export function LessonsRecordModal({
  isOpen,
  openLessonRecord,
  lessons,
  lessonRecords,
  initialRecordData,
  lessonViewMode,
  setLessonViewMode,
  isEditingTime,
  setIsEditingTime,
  editTimeData,
  setEditTimeData,
  previousLessonData,
  groupRoster,
  attendance,
  editingAttendanceNote,
  setEditingAttendanceNote,
  attendanceNoteText,
  setAttendanceNoteText,
  bulkAttendanceStatus,
  setBulkAttendanceStatus,
  lessonMaterials,
  onClose,
  onUpdateLessonTime,
  onSaveRecord,
  onMarkAllAttendance,
  onUpdateStudentAttendance,
  onSaveAttendanceNote,
  onOpenMaterialSelector,
  onRemoveMaterial
}: LessonsRecordModalProps) {
  // Internal state for form data - prevents re-rendering parent on every keystroke
  const [localRecordData, setLocalRecordData] = useState<LessonRecordData>(initialRecordData)

  // Sync with initial data when modal opens or lesson changes
  useEffect(() => {
    if (isOpen && openLessonRecord) {
      setLocalRecordData(initialRecordData)
    }
  }, [isOpen, openLessonRecord, initialRecordData])

  if (!isOpen || !openLessonRecord) {
    return null
  }

  const currentLesson = lessons.find(l => l.id === openLessonRecord)
  const currentRecord = lessonRecords[openLessonRecord]

  if (!currentLesson) {
    return null
  }

  const lessonDate = moment(currentLesson.start_time).format('dddd, MMMM Do YYYY')
  const startTime = moment(currentLesson.start_time).format('HH:mm')
  const endTime = moment(currentLesson.end_time).format('HH:mm')

  const handleCopyPlannedToCovered = () => {
    setLocalRecordData({
      ...localRecordData,
      covered: localRecordData.planned
    })
  }

  const handleCopyPreviousToCovered = () => {
    if (previousLessonData?.planned) {
      setLocalRecordData({
        ...localRecordData,
        covered: previousLessonData.planned
      })
    }
  }

  const handleSave = async () => {
    await onSaveRecord(localRecordData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${currentLesson.group.name} - Lesson Record`}
      size="xl"
    >
      <div className="space-y-4 pt-4">
        {/* Subtitle and Time Edit */}
        <div className="space-y-2">
          <p className="text-sm text-soft-muted">
            {currentLesson.group.school.name} • {currentLesson.group.subject.name}
          </p>

          {/* Date and Time Display/Edit */}
          {!isEditingTime ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-soft">
                {lessonDate} • {startTime} - {endTime}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditTimeData({
                    date: moment(currentLesson.start_time).format('YYYY-MM-DD'),
                    startTime: moment(currentLesson.start_time).format('HH:mm'),
                    endTime: moment(currentLesson.end_time).format('HH:mm')
                  })
                  setIsEditingTime(true)
                }}
                className="text-xs"
              >
                Edit Time
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={editTimeData.date}
                onChange={(e) => setEditTimeData(prev => ({ ...prev, date: e.target.value }))}
                className="surface-input text-sm px-2 py-1"
              />
              <input
                type="time"
                value={editTimeData.startTime}
                onChange={(e) => setEditTimeData(prev => ({ ...prev, startTime: e.target.value }))}
                className="surface-input text-sm px-2 py-1"
              />
              <span className="text-sm text-soft-muted">to</span>
              <input
                type="time"
                value={editTimeData.endTime}
                onChange={(e) => setEditTimeData(prev => ({ ...prev, endTime: e.target.value }))}
                className="surface-input text-sm px-2 py-1"
              />
              <Button
                size="sm"
                onClick={onUpdateLessonTime}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTime(false)}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <div className="surface-body flex rounded-lg p-1">
              <button
                onClick={() => setLessonViewMode('simple')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  lessonViewMode === 'simple'
                    ? 'surface-panel-strong text-slate-900 dark:text-white shadow-sm'
                    : 'text-soft hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => setLessonViewMode('advanced')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  lessonViewMode === 'advanced'
                    ? 'surface-panel-strong text-slate-900 dark:text-white shadow-sm'
                    : 'text-soft hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Advanced
              </button>
            </div>
          </div>
        </div>

        {/* Content - Responsive Layout */}
        <div className={`${lessonViewMode === 'advanced' ? 'md:flex md:gap-6' : ''} space-y-6 md:space-y-0`}>
          {/* Previous Lesson Context - Advanced View Only */}
          {lessonViewMode === 'advanced' && (
            <div className="md:w-80 surface-body p-4 space-y-3 flex-shrink-0">
              <h3 className="font-semibold text-sm mb-3">Previous Lesson</h3>
              {previousLessonData ? (
                <div className="space-y-3">
                  {previousLessonData.planned && (
                    <div>
                      <p className="text-xs font-medium text-soft mb-1">Planned:</p>
                      <div className="text-sm surface-panel p-2 rounded border border-white/10">
                        {previousLessonData.planned}
                      </div>
                      <Button
                        size="sm"
                        className="mt-2 w-full"
                        onClick={handleCopyPreviousToCovered}
                      >
                        Copy → Covered
                      </Button>
                    </div>
                  )}
                  {previousLessonData.homework && (
                    <div>
                      <p className="text-xs font-medium text-soft mb-1">Homework:</p>
                      <div className="text-sm surface-panel p-2 rounded border border-white/10">
                        {previousLessonData.homework}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-soft-muted italic">No previous lesson found</p>
              )}
            </div>
          )}

          {/* Lesson Record Form */}
          <div className="flex-1 space-y-4">
            <div className="surface-body p-4 space-y-4">
              {/* Covered */}
              <div>
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  <label className="text-sm font-medium">What was covered today?</label>
                  {localRecordData.planned && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyPlannedToCovered}
                      className="text-xs"
                    >
                      Copy Planned → Covered
                    </Button>
                  )}
                </div>
                <textarea
                  value={localRecordData.covered}
                  onChange={(e) => setLocalRecordData({ ...localRecordData, covered: e.target.value })}
                  placeholder="Topics covered, activities completed, progress made..."
                  className="surface-input w-full h-20 md:h-24 resize-none text-sm"
                />
              </div>

              {/* Planned */}
              <div>
                <label className="block text-sm font-medium mb-2">Planned for next lesson</label>
                <textarea
                  value={localRecordData.planned}
                  onChange={(e) => setLocalRecordData({ ...localRecordData, planned: e.target.value })}
                  placeholder="Topics to cover, activities to do, goals for next lesson..."
                  className="surface-input w-full h-20 md:h-24 resize-none text-sm"
                />
              </div>

              {/* Homework */}
              <div>
                <label className="block text-sm font-medium mb-2">Homework assigned</label>
                <textarea
                  value={localRecordData.homework}
                  onChange={(e) => setLocalRecordData({ ...localRecordData, homework: e.target.value })}
                  placeholder="Homework assignments, practice exercises, reading..."
                  className="surface-input w-full h-16 md:h-20 resize-none text-sm"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={localRecordData.notes}
                  onChange={(e) => setLocalRecordData({ ...localRecordData, notes: e.target.value })}
                  placeholder="Additional notes, student behavior, important observations..."
                  className="surface-input w-full h-16 md:h-20 resize-none text-sm"
                />
              </div>
            </div>

            {/* Materials Section */}
            <div className="surface-body p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold">
                  Lesson Plans ({lessonMaterials[currentRecord?.id]?.length || 0})
                </h3>
                <Button
                  size="sm"
                  onClick={() => currentRecord && onOpenMaterialSelector(currentRecord.id)}
                >
                  Attach Plans
                </Button>
              </div>

              {currentRecord && lessonMaterials[currentRecord.id]?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {lessonMaterials[currentRecord.id].map((material) => (
                    <div
                      key={material.id}
                      className="surface-panel p-3 flex justify-between items-start gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{material.title}</div>
                        {material.description && (
                          <div className="text-xs text-soft-muted mt-1">{material.description}</div>
                        )}
                        {material.file_url && (
                          <a
                            href={material.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block break-all"
                          >
                            View File →
                          </a>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => currentRecord && onRemoveMaterial(currentRecord.id, material.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0"
                        title="Remove lesson plan"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="surface-panel text-soft-muted italic text-sm p-3 text-center">
                  No lesson plans attached. Click "Attach Plans" to add resources.
                </div>
              )}
            </div>

            {/* Attendance Section */}
            {groupRoster.length > 0 && (
              <div className="surface-body p-4">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="text-base font-semibold">Attendance</h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={bulkAttendanceStatus}
                      onChange={(e) => setBulkAttendanceStatus(e.target.value as 'present' | 'absent' | 'late')}
                      className="surface-input text-xs px-2 py-1 min-h-[32px]"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={() => onMarkAllAttendance(bulkAttendanceStatus)}
                      className="min-h-[32px]"
                    >
                      Mark All
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {groupRoster.map((student) => {
                    const studentAttendance = attendance[student.id]
                    const attendanceStatus = studentAttendance?.status || 'present'

                    return (
                      <div key={student.id} className="surface-panel p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 font-medium text-sm">
                            {student.student_name}
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            <Button
                              size="sm"
                              variant={attendanceStatus === 'present' ? 'default' : 'outline'}
                              onClick={() => onUpdateStudentAttendance(student.id, 'present')}
                              className={`min-w-[60px] text-xs ${
                                attendanceStatus === 'present'
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'text-green-700 dark:text-green-300'
                              }`}
                            >
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant={attendanceStatus === 'absent' ? 'default' : 'outline'}
                              onClick={() => onUpdateStudentAttendance(student.id, 'absent')}
                              className={`min-w-[60px] text-xs ${
                                attendanceStatus === 'absent'
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'text-red-600 dark:text-red-300'
                              }`}
                            >
                              Absent
                            </Button>
                            <Button
                              size="sm"
                              variant={attendanceStatus === 'late' ? 'default' : 'outline'}
                              onClick={() => onUpdateStudentAttendance(student.id, 'late')}
                              className={`min-w-[60px] text-xs ${
                                attendanceStatus === 'late'
                                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                  : 'text-amber-600 dark:text-amber-300'
                              }`}
                            >
                              Late
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingAttendanceNote(student.id)
                                setAttendanceNoteText(studentAttendance?.note || '')
                              }}
                              className="text-xs px-2"
                              title="Add note"
                            >
                              📝
                            </Button>
                          </div>
                        </div>

                        {editingAttendanceNote === student.id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={attendanceNoteText}
                              onChange={(e) => setAttendanceNoteText(e.target.value)}
                              placeholder="Add attendance note..."
                              className="flex-1 surface-input text-xs px-2 py-1"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => onSaveAttendanceNote(student.id)}
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingAttendanceNote(null)
                                setAttendanceNoteText('')
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : studentAttendance?.note ? (
                          <div className="text-xs text-soft-muted italic surface-section-muted p-2 rounded">
                            {studentAttendance.note}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                {/* Attendance Summary */}
                {Object.keys(attendance).length > 0 && (
                  <div className="mt-3 text-sm text-soft pt-3 border-t border-white/10">
                    Present: {Object.values(attendance).filter(a => a.status === 'present').length} •
                    Absent: {Object.values(attendance).filter(a => a.status === 'absent').length} •
                    Late: {Object.values(attendance).filter(a => a.status === 'late').length}
                    {groupRoster.length > 0 && (
                      <span className="ml-2 font-medium">
                        ({Math.round((Object.values(attendance).filter(a => a.status === 'present' || a.status === 'late').length / groupRoster.length) * 100)}% attended)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button
            onClick={handleSave}
            className="flex-1 min-h-[44px]"
          >
            Save Record
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
