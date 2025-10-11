import type { GroupWithRelations } from '../../services/groupsPage'
import type { RosterItem } from '../../types/database'
import { GroupSummaryCard } from './GroupSummaryCard'

interface GroupSummaryListProps {
  groups: GroupWithRelations[]
  rosters: Record<string, RosterItem[]>
  onOpenGroup: (group: GroupWithRelations) => void
}

export function GroupSummaryList({ groups, rosters, onOpenGroup }: GroupSummaryListProps) {
  if (groups.length === 0) {
    return (
      <div className="surface-panel border border-dashed border-white/40 p-12 text-center dark:border-white/15">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">No groups yet</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Create your first group to start managing schedules and rosters.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupSummaryCard
          key={group.id}
          group={group}
          roster={rosters[group.id] || []}
          onOpen={() => onOpenGroup(group)}
        />
      ))}
    </div>
  )
}
