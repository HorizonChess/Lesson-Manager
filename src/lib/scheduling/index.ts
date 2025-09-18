export interface Period {
  start: string
  end: string
}

export interface ScheduleAnalysis {
  strategy: 'perfect-match' | 'partial-match' | 'custom-times'
  academicHours: number
  periodsInWindow: Period[]
  totalMinutes: number
  perfectAlignment: boolean
  suggestedPeriods: Period[]
}

export const DEFAULT_PERIODS: Period[] = [
  { start: '08:00', end: '08:50' },
  { start: '08:50', end: '09:35' },
  { start: '10:15', end: '11:00' },
  { start: '11:00', end: '11:45' },
  { start: '12:00', end: '12:45' },
  { start: '12:45', end: '13:30' },
  { start: '13:45', end: '14:30' },
  { start: '14:30', end: '15:15' }
]

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export const analyzeTimeWindow = (
  startTime: string,
  endTime: string,
  groupCount: number,
  periods: Period[] = DEFAULT_PERIODS
): ScheduleAnalysis => {
  const userStart = timeToMinutes(startTime)
  const userEnd = timeToMinutes(endTime)
  const totalMinutes = userEnd - userStart

  const periodsInWindow = periods.filter(period => {
    const periodStart = timeToMinutes(period.start)
    const periodEnd = timeToMinutes(period.end)
    return periodStart < userEnd && periodEnd > userStart
  })

  const academicHours = periodsInWindow.length
  const perfectStartMatch = periods.some(p => timeToMinutes(p.start) === userStart)
  const perfectEndMatch = periods.some(p => timeToMinutes(p.end) === userEnd)
  const perfectAlignment = perfectStartMatch && perfectEndMatch

  let strategy: ScheduleAnalysis['strategy'] = 'custom-times'

  if (perfectAlignment && periodsInWindow.length > 0) {
    strategy = 'perfect-match'
  } else if (periodsInWindow.length > 0 && Math.abs(periodsInWindow.length - academicHours) <= 1) {
    strategy = 'partial-match'
  }

  return {
    strategy,
    academicHours,
    periodsInWindow,
    totalMinutes,
    perfectAlignment,
    suggestedPeriods: periodsInWindow.slice(0, Math.max(groupCount, 1))
  }
}

export const calculateGroupDistribution = (
  periodsAvailable: number,
  groupCount: number,
  preferredGroups?: number[],
  customDurations?: number[]
): number[] => {
  if (customDurations && customDurations.length === groupCount) {
    const totalCustom = customDurations.reduce((sum, value) => sum + value, 0)
    const hasInvalidValue = customDurations.some(value => value < 1)
    if (!hasInvalidValue && totalCustom === periodsAvailable) {
      return customDurations
    }
  }

  if (periodsAvailable <= 0) {
    return Array(groupCount).fill(1)
  }

  if (periodsAvailable === groupCount) {
    return Array(groupCount).fill(1)
  }

  if (periodsAvailable > groupCount) {
    const basePeriods = Math.floor(periodsAvailable / groupCount)
    const extraPeriods = periodsAvailable % groupCount
    const distribution = Array(groupCount).fill(basePeriods)

    if (preferredGroups && preferredGroups.length >= extraPeriods) {
      for (let i = 0; i < extraPeriods; i++) {
        distribution[preferredGroups[i]]++
      }
    } else {
      for (let i = 0; i < extraPeriods; i++) {
        distribution[i]++
      }
    }

    return distribution
  }

  return Array(groupCount).fill(1)
}

export interface BuildScheduleInput {
  startTime: string
  endTime: string
  groupCount: number
  preferredGroupForExtraPeriods?: number[]
  customGroupDurations?: number[]
  enableMultiPeriodCustomization?: boolean
  mapCustomTimesToPeriods?: boolean
}

export interface ScheduleDetails {
  analysis: ScheduleAnalysis
  periodsForDistribution: Period[]
  distribution: number[]
  slots: Period[]
  customDurations?: number[]
  customDistributionValid: boolean
  periodBalance: number
}

export const buildScheduleDetails = (
  config: BuildScheduleInput,
  periods: Period[] = DEFAULT_PERIODS
): ScheduleDetails => {
  const analysis = analyzeTimeWindow(config.startTime, config.endTime, config.groupCount, periods)

  let periodsForDistribution = [...analysis.periodsInWindow]

  if (analysis.strategy === 'custom-times' && config.mapCustomTimesToPeriods) {
    const userStart = timeToMinutes(config.startTime)
    const userEnd = timeToMinutes(config.endTime)

    let startIndex = 0
    for (let i = 0; i < periods.length; i++) {
      if (timeToMinutes(periods[i].start) <= userStart) {
        startIndex = i
      }
    }

    let endIndex = periods.length - 1
    for (let i = 0; i < periods.length; i++) {
      if (timeToMinutes(periods[i].end) >= userEnd) {
        endIndex = i
        break
      }
    }

    periodsForDistribution = periods.slice(startIndex, endIndex + 1)
  }

  const customDurations = config.enableMultiPeriodCustomization ? config.customGroupDurations : undefined
  const customDistributionValid = !!(
    customDurations &&
    customDurations.length === config.groupCount &&
    customDurations.every(value => value >= 1) &&
    customDurations.reduce((sum, value) => sum + value, 0) === periodsForDistribution.length
  )

  const distribution = calculateGroupDistribution(
    periodsForDistribution.length,
    config.groupCount,
    config.preferredGroupForExtraPeriods,
    customDistributionValid ? customDurations : undefined
  )

  const usePeriodBasedStrategy =
    analysis.strategy === 'perfect-match' ||
    analysis.strategy === 'partial-match' ||
    (analysis.strategy === 'custom-times' && config.mapCustomTimesToPeriods)

  const slots: Period[] = []
  let periodIndex = 0

  if (usePeriodBasedStrategy) {
    for (let i = 0; i < config.groupCount; i++) {
      const periodsForGroup = distribution[i] ?? 1

      if (periodsForGroup === 1 && periodIndex < periodsForDistribution.length) {
        slots.push(periodsForDistribution[periodIndex])
        periodIndex++
      } else if (periodsForGroup > 1 && periodIndex < periodsForDistribution.length) {
        const startPeriod = periodsForDistribution[periodIndex]
        const endPeriodIndex = Math.min(periodIndex + periodsForGroup - 1, periodsForDistribution.length - 1)
        const endPeriod = periodsForDistribution[endPeriodIndex]

        slots.push({ start: startPeriod.start, end: endPeriod.end })
        periodIndex += periodsForGroup
      } else {
        slots.push({ start: config.startTime, end: config.endTime })
      }
    }
  } else {
    for (let i = 0; i < config.groupCount; i++) {
      slots.push({ start: config.startTime, end: config.endTime })
    }
  }

  const periodBalance = customDurations
    ? periodsForDistribution.length - customDurations.reduce((sum, value) => sum + value, 0)
    : 0

  return {
    analysis,
    periodsForDistribution,
    distribution,
    slots,
    customDurations,
    customDistributionValid,
    periodBalance
  }
}
