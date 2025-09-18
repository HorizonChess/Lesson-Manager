import { buildScheduleDetails, calculateGroupDistribution } from '../lib/scheduling'
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react'
import moment from 'moment'
import { useScheduleWizard } from '../hooks/useScheduleWizard'

export function ScheduleWizard() {
  const {
    isOpen,
    loading,
    currentStep,
    currentWizardStep,
    currentSchoolIndex,
    keepExistingData,
    schoolCount,
    schools,
    groupNamingStrategy,
    customGroupNames,
    expandedSchools,
    previewMode,
    progressPercent,
    nextLabel,
    wizardSteps,
    openWizard,
    closeWizard,
    goToNextStep,
    goToPreviousStep,
    canProceed,
    updateGroupName,
    toggleSchoolPreview,
    goToSchoolConfig,
    setKeepExistingData,
    setSchoolCount,
    setSchools,
    setGroupNamingStrategy,
    setPreviewMode
  } = useScheduleWizard()

  const renderStepContent = () => {
    switch (currentWizardStep.id) {
      case 'intro':
        return (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Schedule Builder Wizard</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                I'll help you set up your complete teaching schedule quickly and easily.
                This wizard will guide you through creating schools, subjects, groups, and recurring lessons.
              </p>
            </div>
          </div>
        )

      case 'existing-data':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Existing Data Detected</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                I noticed you already have lessons planned for this year. What would you like to do?
              </p>
            </div>
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="existing-data"
                  className="h-4 w-4 text-blue-600"
                  onChange={() => setKeepExistingData(true)}
                  checked={keepExistingData === true}
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Keep existing lessons</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">I'll add to your current schedule</div>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="existing-data"
                  className="h-4 w-4 text-blue-600"
                  onChange={() => setKeepExistingData(false)}
                  checked={keepExistingData === false}
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Remove and start fresh</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">I'll clear everything and create a new schedule</div>
                </div>
              </label>
            </div>
          </div>
        )

      case 'school-count':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">How many schools?</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                How many schools are you teaching in this year?
              </p>
            </div>
            <div className="flex justify-center">
              <input
                type="number"
                min="1"
                max="10"
                value={schoolCount}
                onChange={(e) => setSchoolCount(parseInt(e.target.value) || 1)}
                className="w-24 text-center text-2xl font-bold border-2 border-blue-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )

      case 'school-names':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">School Names</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Enter the names of your {schoolCount} school{schoolCount > 1 ? 's' : ''}
              </p>
            </div>
            <div className="space-y-3">
              {schools.map((school, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    School {index + 1}
                  </label>
                  <input
                    type="text"
                    value={school.name}
                    onChange={(e) => {
                      const newSchools = [...schools]
                      newSchools[index].name = e.target.value
                      setSchools(newSchools)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder={`Enter name for school ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )

      case 'school-config': {
        const schoolToConfig = schools[currentSchoolIndex]
        if (!schoolToConfig) {
          return (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Add a school name before configuring.
            </div>
          )
        }

        const scheduleDetails = buildScheduleDetails(schoolToConfig)
        const analysis = scheduleDetails.analysis
        const distribution = scheduleDetails.distribution
        const defaultDistribution = calculateGroupDistribution(
          scheduleDetails.periodsForDistribution.length,
          schoolToConfig.groupCount,
          schoolToConfig.preferredGroupForExtraPeriods
        )
        const totalAvailablePeriods = scheduleDetails.periodsForDistribution.length
        const hasUnevenDistribution = distribution.some(periods => periods !== distribution[0])
        const hasMultiplePeriods = distribution.some(periods => periods > 1)
        const hasCustomTimes = analysis.strategy === 'custom-times'
        const minPeriods = distribution.length ? Math.min(...distribution) : 0
        const maxPeriods = distribution.length ? Math.max(...distribution) : 0
        const extraGroupIndexes = distribution.reduce<number[]>((acc, value, index) => {
          if (value > minPeriods) {
            acc.push(index)
          }
          return acc
        }, [])
        const customPeriodBalance = schoolToConfig.enableMultiPeriodCustomization
          ? scheduleDetails.periodBalance
          : 0
        const optionsRange = Math.max(totalAvailablePeriods || 1, maxPeriods || 1)
        const firstPeriod = scheduleDetails.periodsForDistribution[0]
        const lastPeriod = scheduleDetails.periodsForDistribution[scheduleDetails.periodsForDistribution.length - 1]
        const extraSelectionLimit = extraGroupIndexes.length

        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configure {schoolToConfig.name || `School ${currentSchoolIndex + 1}`}</h3>
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
                  value={schoolToConfig.dayOfWeek || 'Monday'}
                  onChange={(e) => {
                    const newSchools = [...schools]
                    newSchools[currentSchoolIndex].dayOfWeek = e.target.value
                    setSchools(newSchools)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
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
                    value={schoolToConfig.startTime || '08:00'}
                    onChange={(e) => {
                      const newSchools = [...schools]
                      newSchools[currentSchoolIndex].startTime = e.target.value
                      setSchools(newSchools)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={schoolToConfig.endTime || '13:30'}
                    onChange={(e) => {
                      const newSchools = [...schools]
                      newSchools[currentSchoolIndex].endTime = e.target.value
                      setSchools(newSchools)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
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
                  value={schoolToConfig.groupCount || 6}
                  onChange={(e) => {
                    const newSchools = [...schools]
                    newSchools[currentSchoolIndex].groupCount = parseInt(e.target.value, 10) || 6
                    setSchools(newSchools)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
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

                {hasUnevenDistribution && (
                  <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={schoolToConfig.showAdvancedOptions || false}
                        onChange={(e) => {
                          const newSchools = [...schools]
                          newSchools[currentSchoolIndex].showAdvancedOptions = e.target.checked
                          if (!e.target.checked) {
                            newSchools[currentSchoolIndex].preferredGroupForExtraPeriods = undefined
                          }
                          setSchools(newSchools)
                        }}
                        className="h-4 w-4 text-blue-600 mt-0.5"
                      />
                      <div className="ml-2">
                        <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Customize uneven distribution
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          Some groups will get {maxPeriods} periods, others {minPeriods}. Check this to pick who gets the extra slots.
                        </div>
                      </div>
                    </label>

                    {schoolToConfig.showAdvancedOptions && (
                      <div className="mt-3 space-y-3 bg-white dark:bg-gray-800 rounded p-3 border border-blue-200 dark:border-blue-700">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Select groups that should get extra periods:
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {Array.from({ length: schoolToConfig.groupCount }, (_, i) => {
                            const willGetExtra = extraGroupIndexes.includes(i)
                            const currentSelection = schoolToConfig.preferredGroupForExtraPeriods || []
                            const isSelected = currentSelection.includes(i)

                            return (
                              <label key={i} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const newSchools = [...schools]
                                    const existing = newSchools[currentSchoolIndex].preferredGroupForExtraPeriods || []
                                    if (e.target.checked) {
                                      const next = Array.from(new Set([...existing, i]))
                                      newSchools[currentSchoolIndex].preferredGroupForExtraPeriods = next.slice(0, extraSelectionLimit)
                                    } else {
                                      newSchools[currentSchoolIndex].preferredGroupForExtraPeriods = existing.filter(value => value !== i)
                                    }
                                    setSchools(newSchools)
                                  }}
                                  className="h-3 w-3 text-blue-600"
                                />
                                <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
                                  Group {i + 1}{willGetExtra && !isSelected ? ' (auto)' : ''}
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
                )}

                {hasMultiplePeriods && !hasUnevenDistribution && (
                  <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={schoolToConfig.enableMultiPeriodCustomization || false}
                        onChange={(e) => {
                          const newSchools = [...schools]
                          if (e.target.checked) {
                            newSchools[currentSchoolIndex].enableMultiPeriodCustomization = true
                            newSchools[currentSchoolIndex].customGroupDurations = [...defaultDistribution]
                          } else {
                            newSchools[currentSchoolIndex].enableMultiPeriodCustomization = false
                            newSchools[currentSchoolIndex].customGroupDurations = undefined
                          }
                          setSchools(newSchools)
                        }}
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

                    {schoolToConfig.enableMultiPeriodCustomization && (
                      <div className="mt-3 space-y-3 bg-white dark:bg-gray-800 rounded p-3 border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Total periods available: {totalAvailablePeriods}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newSchools = [...schools]
                              newSchools[currentSchoolIndex].customGroupDurations = [...defaultDistribution]
                              setSchools(newSchools)
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Reset to smart defaults
                          </button>
                        </div>
                        <div className="space-y-2">
                          {Array.from({ length: schoolToConfig.groupCount }, (_, i) => {
                            const value = schoolToConfig.customGroupDurations?.[i] ?? distribution[i] ?? 1

                            return (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">Group {i + 1}</span>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={value}
                                    onChange={(e) => {
                                      const newValue = parseInt(e.target.value, 10) || 1
                                      const newSchools = [...schools]
                                      const base = newSchools[currentSchoolIndex].customGroupDurations ?? [...defaultDistribution]
                                      const durations = [...base]
                                      durations[i] = newValue
                                      newSchools[currentSchoolIndex].customGroupDurations = durations
                                      setSchools(newSchools)
                                    }}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
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
                )}

                {hasCustomTimes && (
                  <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={schoolToConfig.mapCustomTimesToPeriods || false}
                        onChange={(e) => {
                          const newSchools = [...schools]
                          newSchools[currentSchoolIndex].mapCustomTimesToPeriods = e.target.checked
                          setSchools(newSchools)
                        }}
                        className="h-4 w-4 text-blue-600 mt-0.5"
                      />
                      <div className="ml-2">
                        <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Map to school periods instead
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          Your times don't align with standard periods. Snap to nearby periods for cleaner lesson blocks.
                        </div>
                        {schoolToConfig.mapCustomTimesToPeriods && (
                          <div className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                            We'll use {(firstPeriod ? firstPeriod.start : schoolToConfig.startTime)} - {(lastPeriod ? lastPeriod.end : schoolToConfig.endTime)} as the boundary.
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                )}
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
                      checked={schoolToConfig.durationType === 'full-year'}
                      onChange={() => {
                        const newSchools = [...schools]
                        newSchools[currentSchoolIndex].durationType = 'full-year'
                        setSchools(newSchools)
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">
                      Full School Year (Sep {moment().month() >= 6 ? moment().year() : moment().year() - 1} - Jun {moment().month() >= 6 ? moment().year() + 1 : moment().year()})
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`duration-${currentSchoolIndex}`}
                      value="custom"
                      checked={schoolToConfig.durationType === 'custom'}
                      onChange={() => {
                        const newSchools = [...schools]
                        newSchools[currentSchoolIndex].durationType = 'custom'
                        setSchools(newSchools)
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">Custom Date Range</span>
                  </label>
                </div>
                {schoolToConfig.durationType === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={schoolToConfig.startDate}
                        onChange={(e) => {
                          const newSchools = [...schools]
                          newSchools[currentSchoolIndex].startDate = e.target.value
                          setSchools(newSchools)
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                      <input
                        type="date"
                        value={schoolToConfig.endDate}
                        onChange={(e) => {
                          const newSchools = [...schools]
                          newSchools[currentSchoolIndex].endDate = e.target.value
                          setSchools(newSchools)
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
      case 'group-naming':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Group Naming Strategy</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                How would you like to name your groups?
              </p>
            </div>
            <div className="space-y-3">
              <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="group-naming"
                  value="default"
                  checked={groupNamingStrategy === 'default'}
                  onChange={() => setGroupNamingStrategy('default')}
                  className="h-4 w-4 text-blue-600 mt-1"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Use default names</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Groups will be named "Group 1", "Group 2", etc. (recommended)
                  </div>
                </div>
              </label>
              <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="group-naming"
                  value="individual"
                  checked={groupNamingStrategy === 'individual'}
                  onChange={() => setGroupNamingStrategy('individual')}
                  className="h-4 w-4 text-blue-600 mt-1"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Enter custom names</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    I'll let you name each group individually
                  </div>
                </div>
              </label>
            </div>
          </div>
        )

      case 'preview': {
        if (schools.length === 0) {
          return (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Add at least one school to preview your schedule.
            </div>
          )
        }

        const schoolsWithDetails = schools.map((school, index) => ({
          school,
          details: buildScheduleDetails(school),
          index
        }))
        const totalGroups = schools.reduce((sum, school) => sum + school.groupCount, 0)

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preview Your Schedule</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Review everything before I create your schedule
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMode(previewMode === 'summary' ? 'detailed' : 'summary')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {previewMode === 'summary' ? 'Detailed view' : 'Summary view'}
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <strong>What I'll create:</strong>
                <ul className="mt-1 ml-4 list-disc space-y-1">
                  <li>{schools.length} school{schools.length > 1 ? 's' : ''}</li>
                  <li>{totalGroups} groups total</li>
                  <li>Recurring lessons for the entire school year</li>
                  <li>{previewMode === 'detailed' ? 'Smart period allocation per group' : 'Israeli period structure summary'}</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {schoolsWithDetails.map(({ school, details, index }) => {
                const isExpanded = previewMode === 'detailed' || !!expandedSchools[index]
                const groupCount = school.groupCount
                const fallbackNames = Array.from({ length: groupCount }, (_, i) => `Group ${i + 1}`)
                const storedNames = customGroupNames[school.name] || []
                const resolvedNames = fallbackNames.map((fallback, idx) => storedNames[idx] || fallback)
                const distribution = details.distribution
                const showCustomWarning = school.enableMultiPeriodCustomization && !details.customDistributionValid

                return (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{school.name}</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {school.dayOfWeek}s, {school.startTime} - {school.endTime} - {groupCount} group{groupCount > 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Strategy: {details.analysis.strategy.replace('-', ' ')} - {details.periodsForDistribution.length} period slots
                        </div>
                        {showCustomWarning && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Allocate all periods before continuing.
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => goToSchoolConfig(index)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Adjust
                        </button>
                        {previewMode === 'summary' && (
                          <button
                            type="button"
                            onClick={() => toggleSchoolPreview(index)}
                            className="text-xs text-gray-600 dark:text-gray-300 hover:underline"
                          >
                            {isExpanded ? 'Hide' : 'Details'}
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-2">
                        {details.slots.map((slot, groupIndex) => {
                          const periodCount = distribution[groupIndex] ?? 1
                          const storedName = customGroupNames[school.name]?.[groupIndex] ?? ''
                          const displayName = groupNamingStrategy === 'individual'
                            ? storedName || resolvedNames[groupIndex]
                            : resolvedNames[groupIndex]

                          return (
                            <div key={groupIndex} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded px-3 py-2">
                              <div className="flex-1">
                                {previewMode === 'detailed' && groupNamingStrategy === 'individual' ? (
                                  <input
                                    value={storedName}
                                    onChange={(e) => updateGroupName(school.name, groupIndex, e.target.value)}
                                    placeholder={`Group ${groupIndex + 1}`}
                                    className="w-40 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
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
                )
              })}
            </div>
          </div>
        )
      }
      case 'complete':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Schedule Created Successfully!</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Your complete teaching schedule has been generated. You can now view and manage your lessons, groups, and schools.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="text-sm text-green-800 dark:text-green-300">
                <strong>What was created:</strong>
                <ul className="mt-1 ml-4 list-disc space-y-1">
                  <li>{schools.length} school{schools.length > 1 ? 's' : ''}</li>
                  <li>{schools.length} subject{schools.length > 1 ? 's' : ''} (General Teaching)</li>
                  <li>{schools.reduce((sum, school) => sum + school.groupCount, 0)} groups</li>
                  <li>Hundreds of recurring lessons for the full school year</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Visit the Lessons page to see your schedule in action!
            </p>
          </div>
        )

      default:
        return (
          <div className="text-center">
            <p className="text-gray-500">Step {currentStep + 1} content coming soon...</p>
          </div>
        )
    }
  }

  return (
    <>
      <button
        onClick={openWizard}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Schedule Wizard
        </div>
      </button>

      <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            {/* Progress Bar */}
            <div className="px-6 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Step {currentStep + 1} of {wizardSteps.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(progressPercent)}%
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {currentWizardStep.title}
              </DialogTitle>
              <Description className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {currentWizardStep.description}
              </Description>

              <div className="max-h-[55vh] overflow-y-auto pr-1 sm:pr-2 space-y-4">
                {renderStepContent()}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
              <button
                onClick={currentStep === 0 ? closeWizard : goToPreviousStep}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {currentStep === 0 ? 'Cancel' : 'Back'}
              </button>
              {currentStep === wizardSteps.length - 1 ? (
                <button
                  onClick={closeWizard}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Done
                </button>
              ) : (
                <button
                  onClick={goToNextStep}
                  disabled={!canProceed() || loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {nextLabel}
                </button>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
