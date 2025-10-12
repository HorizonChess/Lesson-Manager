import type { School, Subject } from '../../types/database'

interface GroupFilterBarProps {
  schools: School[]
  subjects: Subject[]
  selectedSchoolId: string
  selectedSubjectId: string
  onSelectSchool: (schoolId: string) => void
  onSelectSubject: (subjectId: string) => void
  onOpenCreate: () => void
}

export function GroupFilterBar({
  schools,
  subjects,
  selectedSchoolId,
  selectedSubjectId,
  onSelectSchool,
  onSelectSubject,
  onOpenCreate
}: GroupFilterBarProps) {
  // Note: Subjects are now global. Filtering by school requires school_subjects junction data.
  // For now, show all subjects when a school is selected
  const filteredSubjects = selectedSchoolId ? subjects : []

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">School Overview</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Manage your groups, schedules, and rosters.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <label htmlFor="school-filter" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            School
          </label>
          <select
            id="school-filter"
            value={selectedSchoolId}
            onChange={(event) => onSelectSchool(event.target.value)}
            className="surface-input min-w-[200px] px-3 py-2 text-sm"
          >
            <option value="">All schools</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="subject-filter" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Subject
          </label>
          <select
            id="subject-filter"
            value={selectedSubjectId}
            onChange={(event) => onSelectSubject(event.target.value)}
            className="surface-input min-w-[200px] px-3 py-2 text-sm"
            disabled={!selectedSchoolId}
          >
            <option value="">{selectedSchoolId ? 'All subjects' : 'Select a school first'}</option>
            {filteredSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          New group
        </button>
      </div>
    </div>
  )
}
