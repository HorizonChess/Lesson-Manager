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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex-1">
            <h2 className="text-xl font-bold">
              {currentLesson.group.name} - Lesson Record
            </h2>
            <p className="text-sm text-gray-500">
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
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="time"
                    value={editTimeData.startTime}
                    onChange={(e) => setEditTimeData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="time"
                    value={editTimeData.endTime}
                    onChange={(e) => setEditTimeData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={onUpdateLessonTime}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingTime(false)}
                    className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setLessonViewMode('simple')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  lessonViewMode === 'simple'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => setLessonViewMode('advanced')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  lessonViewMode === 'advanced'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Advanced
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content - Responsive Layout */}
        <div className="flex-1 overflow-y-auto">
          <div className={`${lessonViewMode === 'advanced' ? 'md:flex' : ''} h-full`}>
            {/* Previous Lesson Context - Advanced View Only */}
            {lessonViewMode === 'advanced' && (
              <div className="md:w-80 border-b md:border-b-0 md:border-r bg-gray-50 dark:bg-gray-900/50 p-4">
                <h3 className="font-semibold text-sm mb-3">Previous Lesson</h3>
                {previousLessonData ? (
                  <div className="space-y-3">
                    {previousLessonData.planned && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Planned:</p>
                        <div className="text-sm bg-white dark:bg-gray-800 p-2 rounded border">
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
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Homework:</p>
                        <div className="text-sm bg-white dark:bg-gray-800 p-2 rounded border">
                          {previousLessonData.homework}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No previous lesson found</p>
                )}
              </div>
            )}

            {/* Lesson Record Form */}
            <div className="flex-1 p-4">
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 h-20 md:h-24 resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Planned for next lesson</label>
                  <textarea
                    value={recordData.planned}
                    onChange={(e) => setRecordData({ ...recordData, planned: e.target.value })}
                    placeholder="Topics to cover, activities to do, goals for next lesson..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 h-20 md:h-24 resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Homework assigned</label>
                  <textarea
                    value={recordData.homework}
                    onChange={(e) => setRecordData({ ...recordData, homework: e.target.value })}
                    placeholder="Homework assignments, practice exercises, reading..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 h-16 md:h-20 resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={recordData.notes}
                    onChange={(e) => setRecordData({ ...recordData, notes: e.target.value })}
                    placeholder="Additional notes, student behavior, important observations..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 h-16 md:h-20 resize-none text-sm"
                  />
                </div>

                {/* Materials Section */}
                <div className="border-t pt-4">
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
                          className="bg-gray-50 dark:bg-gray-700 p-3 rounded border flex justify-between items-start"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{material.title}</div>
                            {material.description && (
                              <div className="text-xs text-gray-500 mt-1">{material.description}</div>
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
                    <div className="text-gray-500 italic text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      No lesson plans attached. Click "Attach Plans" to add resources to this lesson.
                    </div>
                  )}
                </div>

                {/* Attendance Section */}
                {groupRoster.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Attendance</h3>
                      <div className="flex items-center gap-2">
                        <select
                          value={bulkAttendanceStatus}
                          onChange={(e) => setBulkAttendanceStatus(e.target.value as 'present' | 'absent' | 'late')}
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
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
                          <div key={student.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
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
                                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  onClick={() => onUpdateStudentAttendance(student.id, 'absent')}
                                  className={`px-2 py-1 rounded text-xs min-w-[60px] ${
                                    attendanceStatus === 'absent'
                                      ? 'bg-red-600 text-white'
                                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900'
                                  }`}
                                >
                                  Absent
                                </button>
                                <button
                                  onClick={() => onUpdateStudentAttendance(student.id, 'late')}
                                  className={`px-2 py-1 rounded text-xs min-w-[60px] ${
                                    attendanceStatus === 'late'
                                      ? 'bg-yellow-600 text-white'
                                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900'
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
                                className="text-gray-500 hover:text-gray-700 text-xs px-1 py-1 rounded"
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
                                  className="flex-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500"
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
                                  className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : studentAttendance?.note ? (
                              <div className="text-xs text-gray-500 italic bg-white dark:bg-gray-700 p-1 rounded border">
                                {studentAttendance.note}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>

                    {/* Attendance Summary */}
                    {Object.keys(attendance).length > 0 && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
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
        <div className="border-t p-4">
          <div className="flex gap-3">
            <button
              onClick={onSaveLessonRecord}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 flex-1 font-medium min-h-[44px]"
            >
              Save Record
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded hover:bg-gray-400 dark:hover:bg-gray-500 min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}