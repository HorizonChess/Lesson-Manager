import { useState } from 'react'
import moment from 'moment'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { buildScheduleDetails, calculateGroupDistribution } from '../lib/scheduling'

export interface WizardStep {
  id: string
  title: string
  description: string
}

export const wizardSteps: WizardStep[] = [
  { id: 'intro', title: 'Welcome', description: "Let's set up your schedule" },
  { id: 'existing-data', title: 'Existing Data', description: 'What to do with current lessons' },
  { id: 'school-count', title: 'Schools', description: 'How many schools are you teaching in?' },
  { id: 'school-names', title: 'School Names', description: 'Enter your school names' },
  { id: 'school-config', title: 'School Configuration', description: 'Configure each school' },
  { id: 'group-naming', title: 'Group Names', description: 'How would you like to name your groups?' },
  { id: 'preview', title: 'Preview', description: 'Review your schedule before creation' },
  { id: 'complete', title: 'Complete', description: 'Your schedule is ready!' }
]

export interface SchoolConfig {
  name: string
  dayOfWeek: string
  startTime: string
  endTime: string
  groupCount: number
  durationType: 'full-year' | 'custom'
  startDate: string
  endDate: string
  showAdvancedOptions?: boolean
  customGroupDurations?: number[]
  enableMultiPeriodCustomization?: boolean
  mapCustomTimesToPeriods?: boolean
  allowUnevenDistribution?: boolean
  preferredGroupForExtraPeriods?: number[]
}

interface UseScheduleWizardState {
  isOpen: boolean
  openWizard: () => Promise<void>
  closeWizard: () => void
  currentStep: number
  currentWizardStep: WizardStep
  goToNextStep: () => Promise<void>
  goToPreviousStep: () => void
  canProceed: () => boolean
  loading: boolean
  renderStepContent: () => JSX.Element
  wizardSteps: WizardStep[]
  schoolsLength: number
  currentSchoolIndex: number
}

export function useScheduleWizard(): UseScheduleWizardState {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [keepExistingData, setKeepExistingData] = useState<boolean | null>(null)
  const [schoolCount, setSchoolCount] = useState<number>(1)
  const [schools, setSchools] = useState<SchoolConfig[]>([])
  const [currentSchoolIndex, setCurrentSchoolIndex] = useState<number>(0)
  const [groupNamingStrategy, setGroupNamingStrategy] = useState<'individual' | 'default'>('default')
  const [customGroupNames, setCustomGroupNames] = useState<Record<string, string[]>>({})
  const [expandedSchools, setExpandedSchools] = useState<Record<number, boolean>>({})
  const [previewMode, setPreviewMode] = useState<'summary' | 'detailed'>('summary')

  const updateGroupName = (schoolName: string, groupIndex: number, value: string) => {
    setCustomGroupNames(prev => {
      const next = { ...prev }
      const current = next[schoolName] ? [...next[schoolName]] : []
      current[groupIndex] = value
      next[schoolName] = current
      return next
    })
  }

  const toggleSchoolPreview = (index: number) => {
    setExpandedSchools(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const goToSchoolConfig = (index: number) => {
    const targetStep = wizardSteps.findIndex(step => step.id === 'school-config')
    if (targetStep !== -1) {
      setCurrentSchoolIndex(index)
      setCurrentStep(targetStep)
    }
  }

  const isSchoolConfigValid = (school?: SchoolConfig) => {
    if (!school) return false
    if (!school.name.trim()) return false
    if (!school.dayOfWeek) return false
    if (!school.startTime || !school.endTime) return false
    if (school.groupCount < 1) return false

    if (school.enableMultiPeriodCustomization) {
      const details = buildScheduleDetails(school)
      if (!details.customDistributionValid) {
        return false
      }
    }

    return true
  }

  const currentWizardStep = wizardSteps[currentStep]

  const goToNextStep = async () => {
    if (currentStep < wizardSteps.length - 1) {
      if (wizardSteps[currentStep].id === 'school-count' && schools.length === 0) {
        const newSchools: SchoolConfig[] = Array(schoolCount).fill(null).map(() => ({
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

      if (wizardSteps[currentStep].id === 'school-config') {
        if (currentSchoolIndex < schools.length - 1) {
          setCurrentSchoolIndex(currentSchoolIndex + 1)
          return
        }
        setCurrentSchoolIndex(0)
      }

      if (wizardSteps[currentStep].id === 'preview') {
        const allValid = schools.every(isSchoolConfigValid)
        if (!allValid) {
          alert('Please finish configuring all schools before generating your schedule.')
          return
        }

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
      if (wizardSteps[currentStep].id === 'school-config') {
        if (currentSchoolIndex > 0) {
          setCurrentSchoolIndex(currentSchoolIndex - 1)
          return
        }
        setCurrentSchoolIndex(0)
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
    setExpandedSchools({})
    setPreviewMode('summary')
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
    setExpandedSchools({})
    setPreviewMode('summary')
    const hasExistingData = await checkExistingData()
    if (!hasExistingData) {
      setCurrentStep(2)
      setKeepExistingData(false)
    }
  }

  const generateSchedule = async () => {
    if (!user) return

    try {
      if (!keepExistingData) {
        const { error: schoolsDeleteError } = await supabase
          .from('schools')
          .delete()
          .eq('user_id', user.id)
        if (schoolsDeleteError) throw schoolsDeleteError
      }

      for (const schoolConfig of schools) {
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .insert([{ name: schoolConfig.name, user_id: user.id }])
          .select()
          .single()

        if (schoolError) throw schoolError

        const { data: subjectData, error: subjectError } = await supabase
          .from('subjects')
          .insert([{ name: 'General Teaching', school_id: schoolData.id }])
          .select()
          .single()

        if (subjectError) throw subjectError

        const scheduleDetails = buildScheduleDetails(schoolConfig)
        const availablePeriods = scheduleDetails.slots

        for (let i = 0; i < schoolConfig.groupCount; i++) {
          const period = availablePeriods[i] || { start: schoolConfig.startTime, end: schoolConfig.endTime }
          const groupName = groupNamingStrategy === 'individual'
            ? customGroupNames[schoolConfig.name]?.[i] || Group 
            : Group 

          const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .insert([{ name: groupName, school_id: schoolData.id, subject_id: subjectData.id }])
            .select()
            .single()

          if (groupError) throw groupError

          const now = moment()
          const currentSchoolYear = now.month() >= 6 ? now.year() : now.year() - 1

          const startDate = schoolConfig.durationType === 'full-year'
            ? moment(${currentSchoolYear}-09-01)
            : moment(schoolConfig.startDate)
          const endDate = schoolConfig.durationType === 'full-year'
            ? moment(${currentSchoolYear + 1}-06-30)
            : moment(schoolConfig.endDate)

          const currentDate = startDate.clone()
          const lessons = []

          while (currentDate.isBefore(endDate)) {
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
                is_cancelled: false
              })
            }

            currentDate.add(1, 'week')
          }

          if (lessons.length > 0) {
            const { error: lessonsError } = await supabase
              .from('lessons')
              .insert(lessons)

            if (lessonsError) throw lessonsError
          }
        }
      }
    } catch (error) {
      console.error('Error generating schedule:', error)
      throw error
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
        return isSchoolConfigValid(schools[currentSchoolIndex])
      default:
        return true
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

      // existing render cases follow ...
    }
  }

  return {
    isOpen,
    openWizard,
    closeWizard,
    currentStep,
    currentWizardStep,
    goToNextStep,
    goToPreviousStep,
    canProceed,
    loading,
    renderStepContent,
    wizardSteps,
    schoolsLength: schools.length,
    currentSchoolIndex
  }
}
