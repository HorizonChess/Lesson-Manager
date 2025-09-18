import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import moment from 'moment'
import { useAuth } from '../contexts/AuthContext'
import { buildScheduleDetails } from '../lib/scheduling'
import { deleteSchoolsByUser, createSchool } from '../services/schools'
import { createSubject } from '../services/subjects'
import { createGroup } from '../services/groups'
import { hasAnyLessons, insertLessons, type LessonInsert } from '../services/lessons'

export interface WizardStep {
  id: string
  title: string
  description: string
}

export const wizardSteps: WizardStep[] = [
  { id: 'intro', title: 'Welcome', description: 'Let\'s set up your schedule' },
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

export type GroupNamingStrategy = 'individual' | 'default'
export type PreviewMode = 'summary' | 'detailed'

export interface UseScheduleWizardState {
  isOpen: boolean
  loading: boolean
  currentStep: number
  currentWizardStep: WizardStep
  currentSchoolIndex: number
  keepExistingData: boolean | null
  schoolCount: number
  schools: SchoolConfig[]
  groupNamingStrategy: GroupNamingStrategy
  customGroupNames: Record<string, string[]>
  expandedSchools: Record<number, boolean>
  previewMode: PreviewMode
  progressPercent: number
  nextLabel: string
  wizardSteps: WizardStep[]
  openWizard: () => Promise<void>
  closeWizard: () => void
  goToNextStep: () => Promise<void>
  goToPreviousStep: () => void
  canProceed: () => boolean
  updateGroupName: (schoolName: string, groupIndex: number, value: string) => void
  toggleSchoolPreview: (index: number) => void
  goToSchoolConfig: (index: number) => void
  setKeepExistingData: Dispatch<SetStateAction<boolean | null>>
  setSchoolCount: Dispatch<SetStateAction<number>>
  setSchools: Dispatch<SetStateAction<SchoolConfig[]>>
  setGroupNamingStrategy: Dispatch<SetStateAction<GroupNamingStrategy>>
  setPreviewMode: Dispatch<SetStateAction<PreviewMode>>
}

const createDefaultSchoolConfig = (): SchoolConfig => ({
  name: '',
  dayOfWeek: 'Monday',
  startTime: '08:00',
  endTime: '13:30',
  groupCount: 6,
  durationType: 'full-year',
  startDate: '2024-09-01',
  endDate: '2024-06-30'
})

export function useScheduleWizard(): UseScheduleWizardState {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [keepExistingData, setKeepExistingData] = useState<boolean | null>(null)
  const [schoolCount, setSchoolCount] = useState<number>(1)
  const [schools, setSchools] = useState<SchoolConfig[]>([])
  const [currentSchoolIndex, setCurrentSchoolIndex] = useState<number>(0)
  const [groupNamingStrategy, setGroupNamingStrategy] = useState<GroupNamingStrategy>('default')
  const [customGroupNames, setCustomGroupNames] = useState<Record<string, string[]>>({})
  const [expandedSchools, setExpandedSchools] = useState<Record<number, boolean>>({})
  const [previewMode, setPreviewMode] = useState<PreviewMode>('summary')

  const updateGroupName = useCallback((schoolName: string, groupIndex: number, value: string) => {
    setCustomGroupNames(prev => {
      const next = { ...prev }
      const current = next[schoolName] ? [...next[schoolName]] : []
      current[groupIndex] = value
      next[schoolName] = current
      return next
    })
  }, [setCustomGroupNames])

  const toggleSchoolPreview = useCallback((index: number) => {
    setExpandedSchools(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }, [setExpandedSchools])

  const goToSchoolConfig = useCallback((index: number) => {
    const targetStep = wizardSteps.findIndex(step => step.id === 'school-config')
    if (targetStep !== -1) {
      setCurrentSchoolIndex(index)
      setCurrentStep(targetStep)
    }
  }, [setCurrentSchoolIndex, setCurrentStep])

  const isSchoolConfigValid = useCallback((school?: SchoolConfig) => {
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
  }, [])

  const currentWizardStep = useMemo(() => wizardSteps[currentStep], [currentStep])

  const checkExistingData = useCallback(async () => {
    return hasAnyLessons()
  }, [])

  const closeWizard = useCallback(() => {
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
    setLoading(false)
  }, [
    setCurrentSchoolIndex,
    setCurrentStep,
    setCustomGroupNames,
    setExpandedSchools,
    setGroupNamingStrategy,
    setKeepExistingData,
    setLoading,
    setPreviewMode,
    setSchoolCount,
    setSchools
  ])

  const generateSchedule = useCallback(async () => {
    if (!user) return

    try {
      if (!keepExistingData) {
        await deleteSchoolsByUser(user.id)
      }

      for (const schoolConfig of schools) {
        const school = await createSchool({ name: schoolConfig.name, userId: user.id })
        const subject = await createSubject({ name: 'General Teaching', schoolId: school.id })

        const scheduleDetails = buildScheduleDetails(schoolConfig)
        const availablePeriods = scheduleDetails.slots

        for (let i = 0; i < schoolConfig.groupCount; i++) {
          const period = availablePeriods[i] || { start: schoolConfig.startTime, end: schoolConfig.endTime }
          const groupName = groupNamingStrategy === 'individual'
            ? customGroupNames[schoolConfig.name]?.[i] || `Group ${i + 1}`
            : `Group ${i + 1}`

          const group = await createGroup({
            name: groupName,
            schoolId: school.id,
            subjectId: subject.id
          })

          const now = moment()
          const currentSchoolYear = now.month() >= 6 ? now.year() : now.year() - 1

          const startDate = schoolConfig.durationType === 'full-year'
            ? moment(`${currentSchoolYear}-09-01`)
            : moment(schoolConfig.startDate)
          const endDate = schoolConfig.durationType === 'full-year'
            ? moment(`${currentSchoolYear + 1}-06-30`)
            : moment(schoolConfig.endDate)

          const currentDate = startDate.clone()
          const lessons: LessonInsert[] = []

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
                groupId: group.id,
                startTime: lessonStart.toISOString(),
                endTime: lessonEnd.toISOString(),
                isCancelled: false
              })
            }

            currentDate.add(1, 'week')
          }

          if (lessons.length > 0) {
            await insertLessons(lessons)
          }
        }
      }
    } catch (error) {
      console.error('Error generating schedule:', error)
      throw error
    }
  }, [customGroupNames, groupNamingStrategy, keepExistingData, schools, user])

  const goToNextStep = useCallback(async () => {
    if (currentStep >= wizardSteps.length - 1) return

    const stepId = wizardSteps[currentStep].id

    if (stepId === 'school-count' && schools.length === 0) {
      setSchools(Array.from({ length: schoolCount }, () => createDefaultSchoolConfig()))
    }

    if (stepId === 'school-config') {
      if (currentSchoolIndex < schools.length - 1) {
        setCurrentSchoolIndex(currentSchoolIndex + 1)
        return
      }
      setCurrentSchoolIndex(0)
    }

    if (stepId === 'preview') {
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
      return
    }

    setCurrentStep(currentStep + 1)
  }, [
    currentSchoolIndex,
    currentStep,
    generateSchedule,
    isSchoolConfigValid,
    schoolCount,
    schools
  ])

  const goToPreviousStep = useCallback(() => {
    if (currentStep <= 0) return

    const stepId = wizardSteps[currentStep].id

    if (stepId === 'school-config') {
      if (currentSchoolIndex > 0) {
        setCurrentSchoolIndex(currentSchoolIndex - 1)
        return
      }
      setCurrentSchoolIndex(0)
    }

    setCurrentStep(currentStep - 1)
  }, [currentSchoolIndex, currentStep])

  const openWizard = useCallback(async () => {
    setIsOpen(true)
    setExpandedSchools({})
    setPreviewMode('summary')
    setCurrentStep(0)
    setKeepExistingData(null)

    const hasExistingData = await checkExistingData()
    if (!hasExistingData) {
      setCurrentStep(2)
      setKeepExistingData(false)
    }
  }, [checkExistingData])

  const canProceed = useCallback(() => {
    const stepId = wizardSteps[currentStep].id

    switch (stepId) {
      case 'intro':
        return true
      case 'existing-data':
        return keepExistingData !== null
      case 'school-count':
        return schoolCount >= 1 && schoolCount <= 10
      case 'school-names':
        return schools.every(school => school.name.trim().length > 0)
      case 'school-config': {
        const currentSchool = schools[currentSchoolIndex]
        return isSchoolConfigValid(currentSchool)
      }
      case 'group-naming':
        return groupNamingStrategy !== null
      case 'preview':
        return true
      default:
        return true
    }
  }, [currentSchoolIndex, currentStep, groupNamingStrategy, isSchoolConfigValid, keepExistingData, schoolCount, schools])

  const progressPercent = useMemo(() => {
    return ((currentStep + 1) / wizardSteps.length) * 100
  }, [currentStep])

  const nextLabel = useMemo(() => {
    const stepId = wizardSteps[currentStep].id

    if (stepId === 'preview') {
      return 'Create Schedule'
    }

    if (stepId === 'school-config' && currentSchoolIndex < schools.length - 1) {
      return `Next School (${currentSchoolIndex + 2}/${schools.length})`
    }

    return 'Next'
  }, [currentSchoolIndex, currentStep, schools])

  return {
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
  }
}
