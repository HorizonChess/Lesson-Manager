import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import moment from 'moment'

interface WizardStep {
  id: string
  title: string
  description: string
}

const wizardSteps: WizardStep[] = [
  { id: 'intro', title: 'Welcome', description: 'Let\'s set up your schedule' },
  { id: 'existing-data', title: 'Existing Data', description: 'What to do with current lessons' },
  { id: 'school-count', title: 'Schools', description: 'How many schools are you teaching in?' },
  { id: 'school-names', title: 'School Names', description: 'Enter your school names' },
  { id: 'school-config', title: 'School Configuration', description: 'Configure each school' },
  { id: 'group-naming', title: 'Group Names', description: 'How would you like to name your groups?' },
  { id: 'preview', title: 'Preview', description: 'Review your schedule before creation' },
  { id: 'complete', title: 'Complete', description: 'Your schedule is ready!' }
]

interface SchoolConfig {
  name: string
  dayOfWeek: string
  startTime: string
  endTime: string
  groupCount: number
  durationType: 'full-year' | 'custom'
  startDate: string
  endDate: string
}

export function ScheduleWizard() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // Wizard state
  const [keepExistingData, setKeepExistingData] = useState<boolean | null>(null)
  const [schoolCount, setSchoolCount] = useState<number>(1)
  const [schools, setSchools] = useState<SchoolConfig[]>([])
  const [currentSchoolIndex, setCurrentSchoolIndex] = useState<number>(0)
  const [groupNamingStrategy, setGroupNamingStrategy] = useState<'individual' | 'default'>('default')
  const [customGroupNames, setCustomGroupNames] = useState<Record<string, string[]>>({})

  const currentWizardStep = wizardSteps[currentStep]

  const goToNextStep = async () => {
    if (currentStep < wizardSteps.length - 1) {
      // Initialize schools array when moving to school names step
      if (wizardSteps[currentStep].id === 'school-count' && schools.length === 0) {
        const newSchools: SchoolConfig[] = Array(schoolCount).fill(null).map((_, index) => ({
          name: '',
          dayOfWeek: 'Monday',
          startTime: '08:00',
          endTime: '13:30',
          groupCount: 6,
          durationType: 'full-year',
          startDate: '2024-09-01',
          endDate: '2024-06-30'
        }))
        setSchools(newSchools)
      }

      // Handle school configuration navigation
      if (wizardSteps[currentStep].id === 'school-config') {
        if (currentSchoolIndex < schools.length - 1) {
          // Move to next school
          setCurrentSchoolIndex(currentSchoolIndex + 1)
          return // Stay on school-config step
        } else {
          // All schools configured, move to next step
          setCurrentSchoolIndex(0) // Reset for potential back navigation
        }
      }

      // If we're on the preview step, generate the schedule
      if (wizardSteps[currentStep].id === 'preview') {
        setLoading(true)
        try {
          await generateSchedule()
          setCurrentStep(currentStep + 1)
        } catch (error) {
          console.error('Error generating schedule:', error)
          alert('Failed to generate schedule. Please try again.')
        } finally {
          setLoading(false)
        }
      } else {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      // Handle school configuration navigation
      if (wizardSteps[currentStep].id === 'school-config') {
        if (currentSchoolIndex > 0) {
          // Go to previous school
          setCurrentSchoolIndex(currentSchoolIndex - 1)
          return // Stay on school-config step
        } else {
          // First school, go to previous step
          setCurrentSchoolIndex(0)
        }
      }

      setCurrentStep(currentStep - 1)
    }
  }

  const closeWizard = () => {
    setIsOpen(false)
    setCurrentStep(0)
    setKeepExistingData(null)
    setSchoolCount(1)
    setSchools([])
    setCurrentSchoolIndex(0)
    setGroupNamingStrategy('default')
    setCustomGroupNames({})
  }

  const checkExistingData = async () => {
    try {
      const { data: existingLessons } = await supabase
        .from('lessons')
        .select('id')
        .limit(1)

      return existingLessons && existingLessons.length > 0
    } catch (error) {
      console.error('Error checking existing data:', error)
      return false
    }
  }

  const openWizard = async () => {
    setIsOpen(true)
    const hasExistingData = await checkExistingData()
    if (!hasExistingData) {
      // Skip the existing data step if no data exists
      setCurrentStep(2) // Go directly to school count
      setKeepExistingData(false)
    }
  }

  // Default Israeli school periods
  const defaultPeriods = [
    { start: '08:00', end: '08:50' }, // Period 1
    { start: '08:50', end: '09:35' }, // Period 2
    { start: '10:15', end: '11:00' }, // Period 3 (after break)
    { start: '11:00', end: '11:45' }, // Period 4
    { start: '12:00', end: '12:45' }, // Period 5 (after break)
    { start: '12:45', end: '13:30' }, // Period 6
    { start: '13:45', end: '14:30' }, // Period 7 (after break)
    { start: '14:30', end: '15:15' }  // Period 8
  ]

  const generateSchedule = async () => {
    if (!user) return

    try {
      // Step 1: Clear existing data if requested
      if (!keepExistingData) {
        await supabase.from('lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('groups').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('schools').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      }

      // Step 2: Create schools
      for (const schoolConfig of schools) {
        // Create school
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .insert([{ name: schoolConfig.name, user_id: user.id }])
          .select()
          .single()

        if (schoolError) throw schoolError

        // Create a default subject for each school
        const { data: subjectData, error: subjectError } = await supabase
          .from('subjects')
          .insert([{
            name: 'General Teaching',
            school_id: schoolData.id,
            user_id: user.id
          }])
          .select()
          .single()

        if (subjectError) throw subjectError

        // Create groups based on the configured periods
        const availablePeriods = defaultPeriods.slice(0, schoolConfig.groupCount)

        for (let i = 0; i < schoolConfig.groupCount; i++) {
          const period = availablePeriods[i]
          const groupName = groupNamingStrategy === 'individual'
            ? customGroupNames[schoolConfig.name]?.[i] || `Group ${i + 1}`
            : `Group ${i + 1}`

          // Create group
          const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .insert([{
              name: groupName,
              school_id: schoolData.id,
              subject_id: subjectData.id,
              user_id: user.id
            }])
            .select()
            .single()

          if (groupError) throw groupError

          // Create recurring lessons for the entire school year
          const startDate = schoolConfig.durationType === 'full-year'
            ? moment('2024-09-01')
            : moment(schoolConfig.startDate)
          const endDate = schoolConfig.durationType === 'full-year'
            ? moment('2025-06-30')
            : moment(schoolConfig.endDate)

          // Generate lessons for each week
          let currentDate = startDate.clone()
          const lessons = []

          while (currentDate.isBefore(endDate)) {
            // Find the next occurrence of the specified day
            const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(schoolConfig.dayOfWeek)
            const lessonDate = currentDate.clone().day(dayOfWeek)

            if (lessonDate.isSameOrAfter(startDate) && lessonDate.isSameOrBefore(endDate)) {
              const lessonStart = lessonDate.clone()
                .hour(parseInt(period.start.split(':')[0]))
                .minute(parseInt(period.start.split(':')[1]))
              const lessonEnd = lessonDate.clone()
                .hour(parseInt(period.end.split(':')[0]))
                .minute(parseInt(period.end.split(':')[1]))

              lessons.push({
                group_id: groupData.id,
                start_time: lessonStart.toISOString(),
                end_time: lessonEnd.toISOString(),
                is_cancelled: false,
                user_id: user.id
              })
            }

            currentDate.add(1, 'week')
          }

          // Batch insert lessons
          if (lessons.length > 0) {
            const { error: lessonsError } = await supabase
              .from('lessons')
              .insert(lessons)

            if (lessonsError) throw lessonsError
          }
        }
      }

      console.log('Schedule generated successfully!')
    } catch (error) {
      console.error('Error generating schedule:', error)
      throw error
    }
  }

  const renderStepContent = () => {
    switch (wizardSteps[currentStep].id) {
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
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Most teachers work with 1-3 schools
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

      case 'school-config':
        const schoolToConfig = schools[currentSchoolIndex]

        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configure {schoolToConfig?.name || `School ${currentSchoolIndex + 1}`}</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                School {currentSchoolIndex + 1} of {schools.length} - Set up teaching schedule and group details
              </p>
            </div>
            <div className="space-y-4">
              {/* Day of Week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teaching Day
                </label>
                <select
                  value={schoolToConfig?.dayOfWeek || 'Monday'}
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

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={schoolToConfig?.startTime || '08:00'}
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
                    value={schoolToConfig?.endTime || '13:30'}
                    onChange={(e) => {
                      const newSchools = [...schools]
                      newSchools[currentSchoolIndex].endTime = e.target.value
                      setSchools(newSchools)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Group Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Number of Groups
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={schoolToConfig?.groupCount || 6}
                  onChange={(e) => {
                    const newSchools = [...schools]
                    newSchools[currentSchoolIndex].groupCount = parseInt(e.target.value) || 6
                    setSchools(newSchools)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Duration Type */}
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
                      checked={schoolToConfig?.durationType === 'full-year'}
                      onChange={(e) => {
                        const newSchools = [...schools]
                        newSchools[currentSchoolIndex].durationType = 'full-year'
                        setSchools(newSchools)
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">Full School Year (Sep 2024 - Jun 2025)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`duration-${currentSchoolIndex}`}
                      value="custom"
                      checked={schoolToConfig?.durationType === 'custom'}
                      onChange={(e) => {
                        const newSchools = [...schools]
                        newSchools[currentSchoolIndex].durationType = 'custom'
                        setSchools(newSchools)
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">Custom Date Range</span>
                  </label>
                </div>
                {schoolToConfig?.durationType === 'custom' && (
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

      case 'preview':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preview Your Schedule</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Review everything before I create your schedule
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4 max-h-64 overflow-y-auto">
              {schools.map((school, index) => (
                <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <h4 className="font-medium text-gray-900 dark:text-white">{school.name}</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {school.dayOfWeek}s, {school.startTime} - {school.endTime}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {school.groupCount} groups • {school.durationType === 'full-year' ? 'Full year' : 'Custom dates'}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <strong>What I'll create:</strong>
                <ul className="mt-1 ml-4 list-disc space-y-1">
                  <li>{schools.length} school{schools.length > 1 ? 's' : ''}</li>
                  <li>{schools.reduce((sum, school) => sum + school.groupCount, 0)} groups total</li>
                  <li>Recurring lessons for the entire school year</li>
                  <li>Israeli school period structure (8 periods + breaks)</li>
                </ul>
              </div>
            </div>
          </div>
        )

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

  const canProceed = () => {
    switch (wizardSteps[currentStep].id) {
      case 'intro':
        return true
      case 'existing-data':
        return keepExistingData !== null
      case 'school-count':
        return schoolCount >= 1 && schoolCount <= 10
      case 'school-names':
        return schools.every(school => school.name.trim().length > 0)
      case 'school-config':
        const currentSchool = schools[currentSchoolIndex]
        return currentSchool &&
          currentSchool.name.trim().length > 0 &&
          currentSchool.dayOfWeek &&
          currentSchool.startTime &&
          currentSchool.endTime &&
          currentSchool.groupCount >= 1
      case 'group-naming':
        return groupNamingStrategy !== null
      case 'preview':
        return true
      default:
        return true
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
                  {Math.round(((currentStep + 1) / wizardSteps.length) * 100)}%
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / wizardSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {currentWizardStep.title}
              </DialogTitle>
              <Description className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {currentWizardStep.description}
              </Description>

              {renderStepContent()}
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
                  {wizardSteps[currentStep].id === 'preview' ? 'Create Schedule' :
                   wizardSteps[currentStep].id === 'school-config' && currentSchoolIndex < schools.length - 1 ?
                   `Next School (${currentSchoolIndex + 2}/${schools.length})` : 'Next'}
                </button>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}