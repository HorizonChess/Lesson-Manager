import moment from 'moment'
import { buildScheduleDetails, calculateGroupDistribution } from '../../../lib/scheduling'
import type { UseScheduleWizardState } from '../../../hooks/useScheduleWizard'

interface SchoolConfigStepProps {
  wizard: UseScheduleWizardState
}

export function SchoolConfigStep({ wizard }: SchoolConfigStepProps) {
  const { schools, currentSchoolIndex, setSchools } = wizard
  const school = schools[currentSchoolIndex]

  if (!school) {
    return (
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Add a school name before configuring.
      </div>
    )
  }

  const updateSchool = (updater: (draft: typeof school) => void) => {
    const next = [...schools]
    const draft = { ...next[currentSchoolIndex] }
    updater(draft)
    next[currentSchoolIndex] = draft
    setSchools(next)
  }

  const details = buildScheduleDetails(school)
  const distribution = details.distribution
  const analysis = details.analysis
  const defaultDistribution = calculateGroupDistribution(
    details.periodsForDistribution.length,
    school.groupCount,
    school.preferredGroupForExtraPeriods
  )

  const totalAvailablePeriods = details.periodsForDistribution.length
  const hasUnevenDistribution = distribution.some(value => value !== distribution[0])
  const hasMultiplePeriods = distribution.some(value => value > 1)
  const hasCustomTimes = analysis.strategy === 'custom-times'
  const minPeriods = distribution.length ? Math.min(...distribution) : 0
  const maxPeriods = distribution.length ? Math.max(...distribution) : 0
  const extraGroupIndexes = distribution.reduce<number[]>((acc, value, index) => {
    if (value > minPeriods) acc.push(index)
    return acc
  }, [])
  const customPeriodBalance = school.enableMultiPeriodCustomization ? details.periodBalance : 0
  const optionsRange = Math.max(totalAvailablePeriods || 1, maxPeriods || 1)
  const firstPeriod = details.periodsForDistribution[0]
  const lastPeriod = details.periodsForDistribution[details.periodsForDistribution.length - 1]
  const extraSelectionLimit = extraGroupIndexes.length

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configure {school.name || `School ${currentSchoolIndex + 1}`}</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          School {currentSchoolIndex + 1} of {schools.length} - Set up teaching schedule and group details
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Teaching Day
          </label>
          <select
            value={school.dayOfWeek || 'Monday'}
            onChange={(e) => updateSchool(draft => { draft.dayOfWeek = e.target.value })}
            className="surface-input w-full px-3 py-2"
          >
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Sunday'].map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={school.startTime || '08:00'}
              onChange={(e) => updateSchool(draft => { draft.startTime = e.target.value })}
              className="surface-input w-full px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={school.endTime || '13:30'}
              onChange={(e) => updateSchool(draft => { draft.endTime = e.target.value })}
              className="surface-input w-full px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Number of Groups
          </label>
          <input
            type="number"
            min="1"
            max="8"
            value={school.groupCount || 6}
            onChange={(e) => updateSchool(draft => {
              draft.groupCount = parseInt(e.target.value, 10) || 6
            })}
            className="surface-input w-full px-3 py-2"
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 space-y-3">
          <div className="text-sm">
            <div className="font-medium text-blue-800 dark:text-blue-300 mb-2">
              Smart Schedule Analysis
            </div>
            <div className="text-blue-700 dark:text-blue-400 space-y-1">
              <div>- Time window: {analysis.totalMinutes} min ({analysis.academicHours} academic hours)</div>
              <div>- Strategy: {analysis.strategy.replace('-', ' ')}</div>
              <div>- Available periods: {analysis.periodsInWindow.length}</div>
              {hasUnevenDistribution && (
                <div>- Distribution: {distribution.map((p, i) => `Group ${i + 1}: ${p} period${p > 1 ? 's' : ''}`).join(', ')}</div>
              )}
            </div>
          </div>

          {hasUnevenDistribution && renderUnevenDistributionControls()}
          {hasMultiplePeriods && !hasUnevenDistribution && renderMultiPeriodControls()}
          {hasCustomTimes && renderCustomTimesToggle()}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Teaching Duration
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name={`duration-${currentSchoolIndex}`}
                value="full-year"
                checked={school.durationType === 'full-year'}
                onChange={() => updateSchool(draft => { draft.durationType = 'full-year' })}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Full School Year (Sep {moment().month() >= 6 ? moment().year() : moment().year() - 1} - Jun {moment().month() >= 6 ? moment().year() + 1 : moment().year()})
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`duration-${currentSchoolIndex}`}
                value="custom"
                checked={school.durationType === 'custom'}
                onChange={() => updateSchool(draft => { draft.durationType = 'custom' })}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Custom date range</span>
            </label>
          </div>
        </div>

        {school.durationType === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={school.startDate || ''}
                onChange={(e) => updateSchool(draft => { draft.startDate = e.target.value })}
                className="surface-input w-full px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={school.endDate || ''}
                onChange={(e) => updateSchool(draft => { draft.endDate = e.target.value })}
                className="surface-input w-full px-3 py-2"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )

  function renderUnevenDistributionControls() {
    return (
      <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
        <label className="flex items-start">
          <input
            type="checkbox"
            checked={school.showAdvancedOptions || false}
            onChange={(e) => updateSchool(draft => {
              draft.showAdvancedOptions = e.target.checked
              if (!e.target.checked) {
                draft.preferredGroupForExtraPeriods = undefined
              }
            })}
            className="h-4 w-4 text-blue-600 mt-0.5"
          />
          <div className="ml-2">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Customize uneven distribution
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Assign which groups should receive the extra periods.
            </div>
          </div>
        </label>

        {school.showAdvancedOptions && (
          <div className="surface-section-muted mt-3 space-y-2 p-3 border border-blue-200/60 dark:border-blue-500/50">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {extraSelectionLimit > 0
                ? `Select up to ${extraSelectionLimit} group${extraSelectionLimit === 1 ? '' : 's'} to receive extra periods.`
                : 'Each group receives the same number of periods.'}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {distribution.map((periods, index) => {
                const willGetExtra = periods > minPeriods
                const existing = school.preferredGroupForExtraPeriods || []
                const isSelected = existing.includes(index)

                return (
                  <label key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => updateSchool(draft => {
                        const list = draft.preferredGroupForExtraPeriods ? [...draft.preferredGroupForExtraPeriods] : []
                        if (e.target.checked) {
                          const next = Array.from(new Set([...list, index]))
                          draft.preferredGroupForExtraPeriods = next.slice(0, extraSelectionLimit)
                        } else {
                          draft.preferredGroupForExtraPeriods = list.filter(value => value !== index)
                        }
                      })}
                      className="h-3 w-3 text-blue-600"
                    />
                    <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
                      Group {index + 1}{willGetExtra && !isSelected ? ' (auto)' : ''}
                    </span>
                  </label>
                )
              })}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Groups with extra periods will get {maxPeriods} periods instead of {minPeriods}.
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderMultiPeriodControls() {
    return (
      <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
        <label className="flex items-start">
          <input
            type="checkbox"
            checked={school.enableMultiPeriodCustomization || false}
            onChange={(e) => updateSchool(draft => {
              if (e.target.checked) {
                draft.enableMultiPeriodCustomization = true
                draft.customGroupDurations = [...defaultDistribution]
              } else {
                draft.enableMultiPeriodCustomization = false
                draft.customGroupDurations = undefined
              }
            })}
            className="h-4 w-4 text-blue-600 mt-0.5"
          />
          <div className="ml-2">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Customize double/triple lessons
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Groups will get {maxPeriods}-period lessons by default. Adjust to fit your teaching style.
            </div>
          </div>
        </label>

        {school.enableMultiPeriodCustomization && (
          <div className="surface-section-muted mt-3 space-y-3 p-3 border border-blue-200/60 dark:border-blue-500/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Total periods available: {totalAvailablePeriods}</span>
              <button
                type="button"
                onClick={() => updateSchool(draft => {
                  draft.customGroupDurations = [...defaultDistribution]
                })}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Reset to smart defaults
              </button>
            </div>
            <div className="space-y-2">
              {Array.from({ length: school.groupCount }, (_, index) => {
                const value = school.customGroupDurations?.[index] ?? distribution[index] ?? 1

                return (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Group {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={value}
                        onChange={(e) => updateSchool(draft => {
                          const newValue = parseInt(e.target.value, 10) || 1
                          const base = draft.customGroupDurations ? [...draft.customGroupDurations] : [...defaultDistribution]
                          base[index] = newValue
                          draft.customGroupDurations = base
                        })}
                        className="surface-input px-2 py-1 text-sm"
                      >
                        {Array.from({ length: optionsRange }, (_, optionIndex) => optionIndex + 1).map(optionValue => (
                          <option key={optionValue} value={optionValue}>{optionValue}</option>
                        ))}
                      </select>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        period{value > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div
              className={`text-xs ${customPeriodBalance === 0 ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-400'}`}
            >
              {customPeriodBalance === 0
                ? 'All periods allocated perfectly.'
                : customPeriodBalance > 0
                  ? `${customPeriodBalance} period${customPeriodBalance === 1 ? '' : 's'} still unassigned.`
                  : `Over-allocated by ${Math.abs(customPeriodBalance)} period${Math.abs(customPeriodBalance) === 1 ? '' : 's'}.`}
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderCustomTimesToggle() {
    return (
      <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
        <label className="flex items-start">
          <input
            type="checkbox"
            checked={school.mapCustomTimesToPeriods || false}
            onChange={(e) => updateSchool(draft => { draft.mapCustomTimesToPeriods = e.target.checked })}
      
            className="h-4 w-4 text-blue-600 mt-0.5"
          />
          <div className="ml-2">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Map to school periods instead
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Your times don't align with standard periods. Snap to nearby periods for cleaner lesson blocks.
            </div>
            {school.mapCustomTimesToPeriods && (
              <div className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                We'll use {(firstPeriod ? firstPeriod.start : school.startTime)} - {(lastPeriod ? lastPeriod.end : school.endTime)} as the boundary.
              </div>
            )}
          </div>
        </label>
      </div>
    )
  }
}
