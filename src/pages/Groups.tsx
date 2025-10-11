import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { RosterItem, School, Subject } from '../types/database'
import {
  fetchSchools,
  fetchSubjects,
  fetchGroupsWithRelations,
  fetchRosters,
  createGroupWithRelations,
  type GroupWithRelations
} from '../services/groupsPage'
import { GroupFilterBar } from '../components/groups/GroupFilterBar'
import { GroupSummaryList } from '../components/groups/GroupSummaryList'
import { GroupCreateModal } from '../components/groups/GroupCreateModal'
import { Modal } from '../components/Modal'
import { GroupOverview } from '../components/GroupOverview'

export function Groups() {
  const { user } = useAuth()
  const [schools, setSchools] = useState<School[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [groups, setGroups] = useState<GroupWithRelations[]>([])
  const [rosters, setRosters] = useState<Record<string, RosterItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeGroup, setActiveGroup] = useState<GroupWithRelations | null>(null)
  const [showOverview, setShowOverview] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [schoolsData, subjectsData, groupsData, rostersData] = await Promise.all([
        fetchSchools(),
        fetchSubjects(),
        fetchGroupsWithRelations(),
        fetchRosters()
      ])

      setSchools(schoolsData)
      setSubjects(subjectsData)
      setGroups(groupsData)
      setRosters(rostersData)
    } catch (err: any) {
      setError(err?.message || 'Failed to load School Overview data.')
    } finally {
      setLoading(false)
    }
  }

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      if (selectedSchoolId && group.school_id !== selectedSchoolId) {
        return false
      }
      if (selectedSubjectId && group.subject_id !== selectedSubjectId) {
        return false
      }
      return true
    })
  }, [groups, selectedSchoolId, selectedSubjectId])

  const handleCreateGroup = async (payload: {
    name: string
    schoolId: string
    subjectId: string
    timeslots: unknown[]
  }) => {
    const newGroup = await createGroupWithRelations({
      name: payload.name,
      schoolId: payload.schoolId,
      subjectId: payload.subjectId,
      timeslots: payload.timeslots
    })

    setGroups((prev) => [...prev, newGroup])
    setRosters((prev) => ({ ...prev, [newGroup.id]: [] }))

    if (!selectedSchoolId) {
      setSelectedSchoolId(payload.schoolId)
    }
    if (!selectedSubjectId) {
      setSelectedSubjectId(payload.subjectId)
    }
  }

  const handleSelectSchool = (schoolId: string) => {
    setSelectedSchoolId(schoolId)
    setSelectedSubjectId('')
  }

  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId)
  }

  const openOverview = (group: GroupWithRelations) => {
    setActiveGroup(group)
    setShowOverview(true)
  }

  const closeOverview = () => {
    setShowOverview(false)
    setActiveGroup(null)
  }

  const handleGroupUpdate = (updatedGroup: Partial<GroupWithRelations> & { id: string }) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === updatedGroup.id
          ? { ...group, ...updatedGroup }
          : group
      )
    )
    setActiveGroup((prev) => (prev && prev.id === updatedGroup.id ? { ...prev, ...updatedGroup } : prev))
  }

  const handleRosterUpdate = (groupId: string, updatedRoster: RosterItem[]) => {
    setRosters((prev) => ({ ...prev, [groupId]: updatedRoster }))
  }

  const handleGroupDelete = (groupId: string) => {
    setGroups((prev) => prev.filter((group) => group.id !== groupId))
    setRosters((prev) => {
      const next = { ...prev }
      delete next[groupId]
      return next
    })
    closeOverview()
  }

  const activeSchool = activeGroup ? schools.find((school) => school.id === activeGroup.school_id) : null
  const activeSubject = activeGroup ? subjects.find((subject) => subject.id === activeGroup.subject_id) : null

  return (
    <div className="space-y-6">
      <GroupFilterBar
        schools={schools}
        subjects={subjects}
        selectedSchoolId={selectedSchoolId}
        selectedSubjectId={selectedSubjectId}
        onSelectSchool={handleSelectSchool}
        onSelectSubject={handleSelectSubject}
        onOpenCreate={() => setShowCreateModal(true)}
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="surface-panel p-8 text-center text-sm text-slate-500 dark:text-slate-300">
          Loading School Overview...
        </div>
      ) : (
        <GroupSummaryList groups={filteredGroups} rosters={rosters} onOpenGroup={openOverview} />
      )}

      <GroupCreateModal
        isOpen={showCreateModal}
        schools={schools}
        subjects={subjects}
        onClose={() => setShowCreateModal(false)}
        onCreate={async ({ name, schoolId, subjectId, timeslots }) => {
          try {
            await handleCreateGroup({ name, schoolId, subjectId, timeslots })
            setShowCreateModal(false)
          } catch (err: any) {
            setError(err?.message || 'Failed to create group.')
            throw err
          }
        }}
      />

      {activeGroup && activeSchool && activeSubject && (
        <Modal
          isOpen={showOverview}
          onClose={closeOverview}
          title={`${activeGroup.name} overview`}
          size="xl"
        >
          <GroupOverview
            group={activeGroup}
            school={activeSchool}
            subject={activeSubject}
            roster={rosters[activeGroup.id] || []}
            onClose={closeOverview}
            onGroupUpdate={(group) => handleGroupUpdate(group as GroupWithRelations)}
            onRosterUpdate={(roster) => handleRosterUpdate(activeGroup.id, roster)}
            onGroupDelete={handleGroupDelete}
          />
        </Modal>
      )}
    </div>
  )
}
