import { buildScheduleDetails } from '../../../lib/scheduling'
import type { UseScheduleWizardState } from '../../../hooks/useScheduleWizard'

interface PreviewStepProps {
  wizard: UseScheduleWizardState
}

export function PreviewStep({ wizard }: PreviewStepProps) {
  const {
    schools,
    expandedSchools,
    previewMode,
    toggleSchoolPreview,
    goToSchoolConfig,
    setPreviewMode,
    customGroupNames,
    groupNamingStrategy,
    updateGroupName
  } = wizard

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preview your schedule</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Review the generated schedule before creating it. You can still make changes.
        </p>
      </div>

      <div className="surface-section-muted flex items-center justify-between rounded-lg p-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode('summary')}
            className={`surface-chip px-3 py-1 text-[11px] ${previewMode === 'summary' ? 'font-semibold' : 'opacity-70 hover:opacity-100'}`}
          >
            Summary view
          </button>
          <button
            onClick={() => setPreviewMode('detailed')}
            className={`surface-chip px-3 py-1 text-[11px] ${previewMode === 'detailed' ? 'font-semibold' : 'opacity-70 hover:opacity-100'}`}
          >
            Detailed view
          </button>
        </div>
        <button
          onClick={() => setPreviewMode(prev => (prev === 'summary' ? 'detailed' : 'summary'))}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Toggle view
        </button>
      </div>

      <div className="space-y-3">
        {schools.map((school, schoolIndex) => {
          const scheduleDetails = buildScheduleDetails(school)
          const slots = scheduleDetails.slots

          return (
            <div key={schoolIndex} className="surface-panel">
              <button
                onClick={() => toggleSchoolPreview(schoolIndex)}
                className="w-full px-4 py-3 flex justify-between items-center text-left"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {school.name || `School ${schoolIndex + 1}`}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {school.dayOfWeek} • {school.groupCount} group{school.groupCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${expandedSchools[schoolIndex] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSchools[schoolIndex] && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {school.durationType === 'full-year'
                        ? 'Full school year coverage'
                        : `${school.startDate} to ${school.endDate}`}
                    </span>
                    <button
                      onClick={() => goToSchoolConfig(schoolIndex)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Edit configuration
                    </button>
                  </div>

                  {previewMode === 'summary' ? (
                    <div className="surface-section-muted rounded-lg p-3 text-xs space-y-1">
                      <div>Groups: {school.groupCount}</div>
                      <div>Time window: {school.startTime} - {school.endTime}</div>
                      <div>Expected lessons: {(scheduleDetails.slots.length * 36)}</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Array.from({ length: school.groupCount }, (_, groupIndex) => {
                        const slot = slots[groupIndex] || { start: school.startTime, end: school.endTime }
                        const storedName = customGroupNames[school.name]?.[groupIndex] || ''
                        const displayName = groupNamingStrategy === 'individual'
                          ? storedName || `Group ${groupIndex + 1}`
                          : `Group ${groupIndex + 1}`
                        const periodCount = scheduleDetails.distribution[groupIndex] || 1

                        return (
                          <div key={groupIndex} className="surface-section-muted p-2 flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-200 font-semibold">
                              {groupIndex + 1}
                            </div>
                            <div className="flex-1">
                              {previewMode === 'detailed' && groupNamingStrategy === 'individual' ? (
                                <input
                                  value={storedName}
                                  onChange={(e) => updateGroupName(school.name, groupIndex, e.target.value)}
                                  placeholder={`Group ${groupIndex + 1}`}
                                  className="surface-input w-40 text-sm px-2 py-1"
                                />
                              ) : (
                                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{displayName}</div>
                              )}
                              <div className="text-xs text-gray-500 dark:text-gray-300">
                                {slot.start} - {slot.end} - {periodCount} period{periodCount > 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
