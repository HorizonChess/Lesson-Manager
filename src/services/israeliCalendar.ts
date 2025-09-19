import vacationData from '../data/israeliVacations.json'

interface VacationPeriod {
  name: string
  start: string // DD/MM/YYYY
  end: string   // DD/MM/YYYY
  note?: string
}

interface SchoolYearData {
  schoolYearStart: string // DD/MM/YYYY
  schoolYearEnd: string   // DD/MM/YYYY
  vacationPeriods: VacationPeriod[]
}

interface VacationDatabase {
  [schoolYear: string]: SchoolYearData
}

export class IsraeliCalendarService {
  private vacations: VacationDatabase

  constructor() {
    this.vacations = vacationData as VacationDatabase
  }

  /**
   * Parse DD/MM/YYYY string to Date object
   */
  private parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/')
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  /**
   * Get current school year string (e.g., "2025-2026")
   */
  getCurrentSchoolYear(date: Date = new Date()): string {
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // 1-12

    if (month >= 9) {
      // September onwards = current academic year starts
      return `${year}-${year + 1}`
    } else {
      // January-August = continuation of previous academic year
      return `${year - 1}-${year}`
    }
  }

  /**
   * Get next school year string
   */
  getNextSchoolYear(date: Date = new Date()): string {
    const currentYear = this.getCurrentSchoolYear(date)
    const [startYear] = currentYear.split('-').map(Number)
    return `${startYear + 1}-${startYear + 2}`
  }

  /**
   * Check if we have vacation data for a specific school year
   */
  hasDataForYear(schoolYear: string): boolean {
    return schoolYear in this.vacations
  }

  /**
   * Check if a specific date falls during a vacation period
   */
  isVacationDay(date: Date): boolean {
    const schoolYear = this.getCurrentSchoolYear(date)
    const yearData = this.vacations[schoolYear]

    if (!yearData) {
      console.warn(`No vacation data for school year ${schoolYear}`)
      return false
    }

    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    for (const vacation of yearData.vacationPeriods) {
      const startDate = this.parseDate(vacation.start)
      const endDate = this.parseDate(vacation.end)

      if (checkDate >= startDate && checkDate <= endDate) {
        return true
      }
    }

    return false
  }

  /**
   * Check if a date is a regular school day (not vacation, not summer break)
   */
  isSchoolDay(date: Date): boolean {
    const schoolYear = this.getCurrentSchoolYear(date)
    const yearData = this.vacations[schoolYear]

    if (!yearData) {
      console.warn(`No vacation data for school year ${schoolYear}`)
      return true // Default to allowing lessons if no data
    }

    // Check if date is during summer break (July-August)
    const month = date.getMonth() + 1 // 1-12
    if (month === 7 || month === 8) {
      return false
    }

    // Check if date is within school year range
    const schoolStart = this.parseDate(yearData.schoolYearStart)
    const schoolEnd = this.parseDate(yearData.schoolYearEnd)
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (checkDate < schoolStart || checkDate > schoolEnd) {
      return false
    }

    // Check if it's a vacation day
    return !this.isVacationDay(date)
  }

  /**
   * Get vacation period for a specific date (if any)
   */
  getVacationPeriod(date: Date): VacationPeriod | null {
    const schoolYear = this.getCurrentSchoolYear(date)
    const yearData = this.vacations[schoolYear]

    if (!yearData) return null

    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    for (const vacation of yearData.vacationPeriods) {
      const startDate = this.parseDate(vacation.start)
      const endDate = this.parseDate(vacation.end)

      if (checkDate >= startDate && checkDate <= endDate) {
        return vacation
      }
    }

    return null
  }

  /**
   * Check if we need to prompt for calendar update
   * Triggers on July 10th or later if next year's data is missing
   */
  checkForUpdateNeeded(date: Date = new Date()): {needsUpdate: boolean, missingYear: string} {
    const year = date.getFullYear()
    const month = date.getMonth() // 0-11 (June = 5, July = 6)
    const day = date.getDate()
    const nextSchoolYear = this.getNextSchoolYear(date)

    // Only trigger on July 10th or later of the year when we actually need the next year's data
    // For 2026-2027 data, we need it on July 10th, 2026
    const [, nextEndYear] = nextSchoolYear.split('-').map(Number)
    const triggerYear = nextEndYear - 1 // 2026 for the 2026-2027 school year

    if (year === triggerYear && month === 6 && day >= 10) {
      if (!this.hasDataForYear(nextSchoolYear)) {
        return {needsUpdate: true, missingYear: nextSchoolYear}
      }
    }

    return {needsUpdate: false, missingYear: ''}
  }

  /**
   * Generate template structure for a new school year
   */
  generateYearTemplate(schoolYear: string): object {
    const [startYear, endYear] = schoolYear.split('-')

    return {
      [schoolYear]: {
        "schoolYearStart": `01/09/${startYear}`,
        "schoolYearEnd": `30/06/${endYear}`,
        "vacationPeriods": [
          {"name": "Rosh Hashana", "start": "DD/MM/YYYY", "end": "DD/MM/YYYY"},
          {"name": "Yom Kippur", "start": "DD/MM/YYYY", "end": "DD/MM/YYYY"},
          {"name": "Days Between Yom Kippur and Sukkot", "start": "DD/MM/YYYY", "end": "DD/MM/YYYY"},
          {"name": "Sukkot", "start": "DD/MM/YYYY", "end": "DD/MM/YYYY"},
          {"name": "Chanukah", "start": "DD/MM/YYYY", "end": "DD/MM/YYYY"},
          {"name": "Tu BiShvat", "start": "DD/MM/YYYY", "end": "DD/MM/YYYY", "note": "Usually a school day"},
          {"name": "Purim", "start": "DD/MM/YYYY", "end": "DD/MM/YYYY"},
          {"name": "Passover", "start": "DD/MM/YYYY", "end": "DD/MM/YYYY"},
          {"name": "Independence Day", "start": "DD/MM/YYYY", "end": "DD/MM/YYYY"},
          {"name": "Lag BaOmer", "start": "DD/MM/YYYY", "end": "DD/MM/YYYY", "note": "Check if school day or vacation"},
          {"name": "Shavuot", "start": "DD/MM/YYYY", "end": "DD/MM/YYYY"}
        ]
      }
    }
  }

  /**
   * Get all vacation periods for a specific school year
   */
  getVacationPeriodsForYear(schoolYear?: string): VacationPeriod[] {
    const year = schoolYear || this.getCurrentSchoolYear()
    const yearData = this.vacations[year]
    return yearData ? yearData.vacationPeriods : []
  }

  /**
   * Get available school years in the data
   */
  getAvailableSchoolYears(): string[] {
    return Object.keys(this.vacations).sort()
  }
}

// Export singleton instance
export const israeliCalendar = new IsraeliCalendarService()
