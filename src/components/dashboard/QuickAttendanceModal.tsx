import { useState, useMemo } from 'react'
import { Modal } from '../Modal'
import { Button } from '../ui/button'
import type { RosterItem, Attendance } from '../../types/database'
import {
  ensureQuickLessonRecord,
  markStudentAttendance,
  bulkMarkAttendance
} from '../../services/attendance'

interface QuickAttendanceModalProps {
  isOpen: boolean
  lessonId: string | null
  lessonTitle: string
  lessonDate: string
  lessonTime: string
  roster: RosterItem[]
  initialAttendance: Record<string, Attendance>
  onClose: () => void
  onSuccess: () => void
  onOpenFullRecord?: () => void
}

export function QuickAttendanceModal({
  isOpen,
  lessonId,
  lessonTitle,
  lessonDate,
  lessonTime,
  roster,
  initialAttendance,
  onClose,
  onSuccess,
  onOpenFullRecord
}: QuickAttendanceModalProps) {
  const [attendance, setAttendance] = useState<Record<string, Attendance>>(initialAttendance)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lessonRecordId, setLessonRecordId] = useState<string | null>(null)
  const [bulkStatus, setBulkStatus] = useState<'present' | 'absent' | 'late'>('present')

  // Memoize attendance statistics
  const stats = useMemo(() => {
    const presentCount = Object.values(attendance).filter(a => a.status === 'present').length
    const absentCount = Object.values(attendance).filter(a => a.status === 'absent').length
    const lateCount = Object.values(attendance).filter(a => a.status === 'late').length
    const attendanceRate = roster.length > 0
      ? Math.round(((presentCount + lateCount) / roster.length) * 100)
      : 0
    return { presentCount, absentCount, lateCount, attendanceRate }
  }, [attendance, roster.length])

  // Ensure lesson record exists before marking attendance
  const ensureRecord = async () => {
    if (lessonRecordId) return lessonRecordId
    if (!lessonId) throw new Error('No lesson ID provided')

    try {
      const recordId = await ensureQuickLessonRecord(lessonId)
      setLessonRecordId(recordId)
      return recordId
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const handleMarkStudent = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    try {
      setError(null)
      const recordId = await ensureRecord()

      const updated = await markStudentAttendance(recordId, studentId, status)

      setAttendance(prev => ({
        ...prev,
        [studentId]: updated
      }))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleMarkAll = async () => {
    try {
      setError(null)
      setSaving(true)
      const recordId = await ensureRecord()

      const updatedRecords = await bulkMarkAttendance(recordId, roster, bulkStatus)

      const newAttendance: Record<string, Attendance> = {}
      updatedRecords.forEach(record => {
        newAttendance[record.roster_item_id] = record
      })

      setAttendance(newAttendance)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setAttendance(initialAttendance)
    setError(null)
    setLessonRecordId(null)
    onClose()
  }

  const handleSaveAndClose = () => {
    onSuccess()
    handleClose()
  }

  const handleOpenFullRecord = () => {
    onOpenFullRecord?.()
    handleClose()
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Quick Attendance"
      size="lg"
    >
      <div className="space-y-4 pt-4">
        {/* Lesson Info */}
        <div className="surface-body p-4 rounded-lg">
          <h3 className="font-semibold text-base mb-1">{lessonTitle}</h3>
          <p className="text-sm text-soft">
            {lessonDate} • {lessonTime}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Bulk Actions */}
        {roster.length > 0 && (
          <div className="surface-body p-4 rounded-lg">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium">Quick Actions:</span>
              <div className="flex items-center gap-2">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as 'present' | 'absent' | 'late')}
                  className="surface-input text-sm px-3 py-1.5 min-h-[36px]"
                >
                  <option value="present">All Present</option>
                  <option value="absent">All Absent</option>
                  <option value="late">All Late</option>
                </select>
                <Button
                  size="sm"
                  onClick={handleMarkAll}
                  disabled={saving}
                  className="min-h-[36px]"
                >
                  {saving ? 'Marking...' : 'Mark All'}
                </Button>
              </div>
            </div>

            {/* Attendance Summary */}
            {Object.keys(attendance).length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10 text-sm text-soft flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span>Present: {stats.presentCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>Absent: {stats.absentCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  <span>Late: {stats.lateCount}</span>
                </div>
                <div className="ml-auto font-semibold">
                  {stats.attendanceRate}% attended
                </div>
              </div>
            )}
          </div>
        )}

        {/* Student List */}
        {roster.length > 0 ? (
          <div className="surface-body p-4 rounded-lg">
            <h3 className="text-sm font-semibold mb-3">Students ({roster.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {roster.map((student) => {
                const studentAttendance = attendance[student.id]
                const status = studentAttendance?.status || 'present'

                return (
                  <div key={student.id} className="surface-panel p-3 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{student.student_name}</span>
                      {studentAttendance?.note && (
                        <p className="text-xs text-soft-muted italic mt-1 truncate">
                          {studentAttendance.note}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant={status === 'present' ? 'default' : 'outline'}
                        onClick={() => handleMarkStudent(student.id, 'present')}
                        className={`min-w-[60px] text-xs ${
                          status === 'present'
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900'
                        }`}
                      >
                        ✓
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'absent' ? 'default' : 'outline'}
                        onClick={() => handleMarkStudent(student.id, 'absent')}
                        className={`min-w-[60px] text-xs ${
                          status === 'absent'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900'
                        }`}
                      >
                        ✕
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'late' ? 'default' : 'outline'}
                        onClick={() => handleMarkStudent(student.id, 'late')}
                        className={`min-w-[60px] text-xs ${
                          status === 'late'
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'text-amber-600 dark:text-amber-300 hover:bg-yellow-100 dark:hover:bg-yellow-900'
                        }`}
                      >
                        ⚠
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="surface-body p-8 rounded-lg text-center">
            <p className="text-soft-muted italic">No students in this group yet</p>
            <p className="text-sm text-soft-muted mt-2">
              Add students in the School Overview page
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button
            onClick={handleSaveAndClose}
            className="flex-1 min-h-[44px]"
            disabled={saving}
          >
            Done
          </Button>
          {onOpenFullRecord && (
            <Button
              variant="outline"
              onClick={handleOpenFullRecord}
              className="min-h-[44px]"
            >
              Open Full Record
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleClose}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
