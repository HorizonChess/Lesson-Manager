import moment from 'moment'
import type { Dispatch, SetStateAction } from 'react'
import type { NormalizedLesson } from '../../services/lessonsPage'
import type { Attendance, Material, LessonRecord, RosterItem } from '../../types/database'
import type { LessonRecordData, EditTimeData } from './types'

interface LessonsRecordModalProps {
  isOpen: boolean
  openLessonRecord: string | null
  lessons: NormalizedLesson[]
  lessonRecords: Record<string, LessonRecord>
  recordData: LessonRecordData
  setRecordData: Dispatch<SetStateAction<LessonRecordData>>
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
  onCopyPlannedToCovered: () => void
  onCopyPreviousToCovered: () => void
  onMarkAllAttendance: (status: 'present' | 'absent' | 'late') => Promise<void>
  onUpdateStudentAttendance: (studentId: string, status: 'present' | 'absent' | 'late', note?: string) => Promise<void>
  onSaveAttendanceNote: (studentId: string) => Promise<void>
  onOpenMaterialSelector: (lessonRecordId: string) => void
  onRemoveMaterial: (lessonRecordId: string, materialId: string) => Promise<void>
  onSaveLessonRecord: () => Promise<void>
}

export function LessonsRecordModal({
  isOpen,
  openLessonRecord,
  lessons,
  lessonRecords,
  recordData,
  setRecordData,
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
  onCopyPlannedToCovered,
  onCopyPreviousToCovered,
  onMarkAllAttendance,
  onUpdateStudentAttendance,
  onSaveAttendanceNote,
  onOpenMaterialSelector,
  onRemoveMaterial,
  onSaveLessonRecord
}: LessonsRecordModalProps) {
  if (!isOpen || !openLessonRecord) {
    return null
  }

  const currentLesson = lessons.find(l => l.id === openLessonRecord)
  const currentRecord = lessonRecords[openLessonRecord]

  if (!currentLesson) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="surface-modal w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="surface-toolbar flex flex-col gap-4 rounded-none border-b border-white/12 px-6 py-5">
          <div className="flex-1">
            <h2 className="text-xl font-bold">
              {currentLesson.group.name} - Lesson Record
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              {currentLesson.group.school.name} • {currentLesson.group.subject.name}
            </p>

            {/* Date and Time Display/Edit */}
            <div className="mt-2">
              {!isEditingTime ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {(() => {
                      const date = moment(currentLesson.start_time).format('dddd, MMMM Do YYYY')
                      const startTime = moment(currentLesson.start_time).format('HH:mm')
                      const endTime = moment(currentLesson.end_time).format('HH:mm')
                      return `${date} • ${startTime} - ${endTime}`
                    })()}
                  </span>
                  <button
                    onClick={() => {
                      setEditTimeData({
                        date: moment(currentLesson.start_time).format('YYYY-MM-DD'),
                        startTime: moment(currentLesson.start_time).format('HH:mm'),
                        endTime: moment(currentLesson.end_time).format('HH:mm')
                      })
                      setIsEditingTime(true)
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                    title="Edit lesson time"
                  >
                    Edit Time
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
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
                  <span className="text-sm text-slate-500">to</span>
                  <input
                    type="time"
                    value={editTimeData.endTime}
                    onChange={(e) => setEditTimeData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="surface-input text-sm px-2 py-1"
                  />
                  <button
                    onClick={onUpdateLessonTime}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingTime(false)}
                    className="surface-chip text-sm font-medium px-3 py-1 hover:opacity-85"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="surface-section-muted flex rounded-lg p-1">
              <button
                onClick={() => setLessonViewMode('simple')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  lessonViewMode === 'simple'
                    ? 'surface-panel-strong text-slate-900 dark:text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => setLessonViewMode('advanced')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  lessonViewMode === 'advanced'
                    ? 'surface-panel-strong text-slate-900 dark:text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Advanced
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-gray-700 text-xl min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content - Responsive Layout */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className={`${lessonViewMode === 'advanced' ? 'md:flex md:gap-6 md:space-y-0' : ''} h-full space-y-6`}>
            {/* Previous Lesson Context - Advanced View Only */}
            {lessonViewMode === 'advanced' && (
              <div className="md:w-80 surface-panel p-4 space-y-3">
                <h3 className="font-semibold text-sm mb-3">Previous Lesson</h3>
                {previousLessonData ? (
                  <div className="space-y-3">
                    {previousLessonData.planned && (
                      <div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Planned:</p>
                        <div className="text-sm surface-panel p-2 rounded border">
                          {previousLessonData.planned}
                        </div>
                        <button
                          onClick={onCopyPreviousToCovered}
                          className="mt-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 w-full"
                        >
                          Copy → Covered
                        </button>
                      </div>
                    )}
                    {previousLessonData.homework && (
                      <div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Homework:</p>
                        <div className="text-sm surface-panel p-2 rounded border">
                          {previousLessonData.homework}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No previous lesson found</p>
                )}
              </div>
            )}

            {/* Lesson Record Form */}
            <div className="surface-panel flex-1 p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap gap-2 items-center mb-2">
                    <label className="block text-sm font-medium">What was covered today?</label>
                    {recordData.planned && (
                      <button
                        onClick={onCopyPlannedToCovered}
                        className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                      >
                        Copy Planned → Covered
                      </button>
                    )}
                  </div>
                  <textarea
                    value={recordData.covered}
                    onChange={(e) => setRecordData({ ...recordData, covered: e.target.value })}
                    placeholder="Topics covered, activities completed, progress made..."
                    className="surface-input w-full h-20 md:h-24 resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Planned for next lesson</label>
                  <textarea
                    value={recordData.planned}
                    onChange={(e) => setRecordData({ ...recordData, planned: e.target.value })}
                    placeholder="Topics to cover, activities to do, goals for next lesson..."
                    className="surface-input w-full h-20 md:h-24 resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Homework assigned</label>
                  <textarea
                    value={recordData.homework}
                    onChange={(e) => setRecordData({ ...recordData, homework: e.target.value })}
                    placeholder="Homework assignments, practice exercises, reading..."
                    className="surface-input w-full h-16 md:h-20 resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={recordData.notes}
                    onChange={(e) => setRecordData({ ...recordData, notes: e.target.value })}
                    placeholder="Additional notes, student behavior, important observations..."
                    className="surface-input w-full h-16 md:h-20 resize-none text-sm"
                  />
                </div>

                {/* Materials Section */}
                <div className="border-t surface-divider pt-4 mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Lesson Plans ({lessonMaterials[currentRecord?.id]?.length || 0})</h3>
                    <button
                      onClick={() => currentRecord && onOpenMaterialSelector(currentRecord.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Attach Plans
                    </button>
                  </div>

                  {currentRecord && lessonMaterials[currentRecord.id]?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {lessonMaterials[currentRecord.id].map((material) => (
                        <div
                          key={material.id}
                          className="surface-panel p-3 flex justify-between items-start"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{material.title}</div>
                            {material.description && (
                              <div className="text-xs text-slate-500 mt-1">{material.description}</div>
                            )}
                            {material.file_url && (
                              <a
                                href={material.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block break-all"
                              >
                                View File →
                              </a>
                            )}
                          </div>
                          <button
                            onClick={() => currentRecord && onRemoveMaterial(currentRecord.id, material.id)}
                            className="text-red-600 hover:text-red-800 text-sm ml-2 flex-shrink-0"
                            title="Remove lesson plan"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="surface-panel text-slate-600 dark:text-slate-300 italic text-sm p-3">
                      No lesson plans attached. Click "Attach Plans" to add resources to this lesson.
                    </div>
                  )}
                </div>

                {/* Attendance Section */}
                {groupRoster.length > 0 && (
                  <div className="border-t surface-divider pt-4 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Attendance</h3>
                      <div className="flex items-center gap-2">
                        <select
                          value={bulkAttendanceStatus}
                          onChange={(e) => setBulkAttendanceStatus(e.target.value as 'present' | 'absent' | 'late')}
                          className="surface-chip text-xs px-2 py-1"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                        </select>
                        <button
                          onClick={() => onMarkAllAttendance(bulkAttendanceStatus)}
                          className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 min-h-[32px]"
                        >
                          Mark All {bulkAttendanceStatus}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {groupRoster.map((student) => {
                        const studentAttendance = attendance[student.id]
                        const attendanceStatus = studentAttendance?.status || 'present'

                        return (
                          <div key={student.id} className="surface-panel p-2">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-1 font-medium text-sm">
                                {student.student_name}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => onUpdateStudentAttendance(student.id, 'present')}
                                  className={`px-2 py-1 rounded text-xs min-w-[60px] ${
                                    attendanceStatus === 'present'
                                      ? 'bg-green-600 text-white'
                                      : 'surface-chip text-green-700 dark:text-green-200 hover:opacity-90'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  onClick={() => onUpdateStudentAttendance(student.id, 'absent')}
                                  className={`px-2 py-1 rounded text-xs min-w-[60px] ${
                                    attendanceStatus === 'absent'
                                      ? 'bg-red-600 text-white'
                                      : 'surface-chip text-red-600 dark:text-red-300 hover:opacity-90'
                                  }`}
                                >
                                  Absent
                                </button>
                                <button
                                  onClick={() => onUpdateStudentAttendance(student.id, 'late')}
                                  className={`px-2 py-1 rounded text-xs min-w-[60px] ${
                                    attendanceStatus === 'late'
                                      ? 'bg-yellow-600 text-white'
                                      : 'surface-chip text-amber-600 dark:text-amber-200 hover:opacity-90'
                                  }`}
                                >
                                  Late
                                </button>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingAttendanceNote(student.id)
                                  setAttendanceNoteText(studentAttendance?.note || '')
                                }}
                                className="text-slate-500 hover:text-gray-700 text-xs px-1 py-1 rounded"
                                title="Add note"
                              >
                                📝
                              </button>
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
                                <button
                                  onClick={() => onSaveAttendanceNote(student.id)}
                                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingAttendanceNote(null)
                                    setAttendanceNoteText('')
                                  }}
                                  className="surface-chip text-xs text-slate-700 dark:text-slate-200 px-2 py-1 hover:opacity-90"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : studentAttendance?.note ? (
                              <div className="text-xs text-slate-500 italic surface-panel p-1">
                                {studentAttendance.note}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>

                    {/* Attendance Summary */}
                    {Object.keys(attendance).length > 0 && (
                      <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
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
          </div>
        </div>

        {/* Footer */}
        <div className="surface-toolbar rounded-none border-t border-white/12 px-6 py-4">
          <div className="flex gap-3">
            <button
              onClick={onSaveLessonRecord}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 flex-1 font-medium min-h-[44px]"
            >
              Save Record
            </button>
            <button
              onClick={onClose}
              className="surface-panel px-6 py-3 min-h-[44px] text-slate-800 dark:text-slate-100 hover:opacity-95"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}