import type { GroupWithRelations } from '../../services/groupsPage'
import type { RosterItem } from '../../types/database'

interface GroupSummaryCardProps {
  group: GroupWithRelations
  roster: RosterItem[]
  onOpen: () => void
}

type Timeslot = {
  day?: string
  startTime?: string
  endTime?: string
}

export function GroupSummaryCard({ group, roster, onOpen }: GroupSummaryCardProps) {
  const timeslots = Array.isArray(group.timeslots)
    ? (group.timeslots as Timeslot[])
    : []

  return (
    <div className="surface-panel flex flex-col justify-between p-4 transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{group.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              {group.school?.name || 'Unknown school'} / {group.subject?.name || 'Unknown subject'}
            </p>
          </div>
          <span className="surface-chip text-blue-700 dark:text-blue-200">
            {roster.length} student{roster.length === 1 ? '' : 's'}
          </span>
        </div>

        {timeslots.length > 0 ? (
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {timeslots.map((slot, index) => (
              <li key={`${group.id}-slot-${index}`} className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                <span>
                  {slot.day || 'Day'} / {slot.startTime || '--:--'} - {slot.endTime || '--:--'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-slate-500 dark:text-slate-300">No schedule configured yet.</p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-slate-500 dark:text-slate-300">
        <span>Updated {new Date(group.updated_at).toLocaleDateString()}</span>
        <button
          type="button"
          onClick={onOpen}
          className="rounded-md border border-transparent bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          View details
        </button>
      </div>
    </div>
  )
}
