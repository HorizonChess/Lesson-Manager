import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { School, Subject, Group } from '../types/database'

interface AttendanceReportData {
  school: string
  subject: string
  group: string
  studentName: string
  totalLessons: number
  presentCount: number
  lateCount: number
  absentCount: number
  attendancePercentage: number
}

interface CoverageReportData {
  school: string
  subject: string
  group: string
  lessonDate: string
  covered: string
  planned: string
  homework: string
}

interface HoursReportData {
  school: string
  subject?: string
  group?: string
  totalHours: number
  activeLessons: number
}

export function Reports() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [schools, setSchools] = useState<School[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  // Report data
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReportData[]>([])
  const [coverageReport, setCoverageReport] = useState<CoverageReportData[]>([])
  const [hoursReport, setHoursReport] = useState<HoursReportData[]>([])

  useEffect(() => {
    if (user) {
      fetchFilters()
    }
  }, [user])

  const fetchFilters = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name')

      if (error) throw error
      setSchools(data || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const generateAttendanceReport = async () => {
    setLoading(true)
    // Implementation will be added
    setTimeout(() => {
      setAttendanceReport([])
      setLoading(false)
    }, 1000)
  }

  const generateCoverageReport = async () => {
    setLoading(true)
    // Implementation will be added
    setTimeout(() => {
      setCoverageReport([])
      setLoading(false)
    }, 1000)
  }

  const generateHoursReport = async () => {
    setLoading(true)
    // Implementation will be added
    setTimeout(() => {
      setHoursReport([])
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reports</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">School</label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="">All Schools</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              disabled={!selectedSchool}
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Group</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              disabled={!selectedSubject}
            >
              <option value="">All Groups</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Report Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Attendance Report</h3>
          <p className="text-sm text-gray-600 mb-4">Attendance % computed for a date range; persisted per lesson</p>
          <button
            onClick={generateAttendanceReport}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Hours Report</h3>
          <p className="text-sm text-gray-600 mb-4">Hours taught per school/group/date range (sum non-canceled durations)</p>
          <button
            onClick={generateHoursReport}
            disabled={loading}
            className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Coverage Report</h3>
          <p className="text-sm text-gray-600 mb-4">Coverage list: lessons + "covered" text</p>
          <button
            onClick={generateCoverageReport}
            disabled={loading}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 p-4 rounded-lg">
        <div className="text-blue-800 dark:text-blue-200">
          <h3 className="font-semibold mb-2">M9 — Reports Implementation</h3>
          <p className="text-sm">
            This is the foundation for the Reports functionality. The report generation logic will be implemented
            to match the acceptance criteria: Reports match hand-calculated checks on seed data.
          </p>
        </div>
      </div>
    </div>
  )
}