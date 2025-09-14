// Simple test script for Israeli Calendar integration
// Run this with: node test-calendar.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read the vacation data
const vacationDataPath = path.join(__dirname, 'src', 'data', 'israeliVacations.json')
const vacationData = JSON.parse(fs.readFileSync(vacationDataPath, 'utf8'))

// Simple calendar service implementation for testing
class TestIsraeliCalendar {
  constructor(data) {
    this.vacations = data
  }

  parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/')
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  getCurrentSchoolYear(date = new Date()) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    if (month >= 9) {
      return `${year}-${year + 1}`
    } else {
      return `${year - 1}-${year}`
    }
  }

  isVacationDay(date) {
    const schoolYear = this.getCurrentSchoolYear(date)
    const yearData = this.vacations[schoolYear]

    if (!yearData) return false

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

  getVacationPeriod(date) {
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
}

// Create test instance
const calendar = new TestIsraeliCalendar(vacationData)

console.log('🗓️  Israeli Calendar Integration Test')
console.log('=====================================')

// Test 1: Current school year detection
const currentYear = calendar.getCurrentSchoolYear()
console.log(`✅ Current school year: ${currentYear}`)

// Test 2: Vacation data loading
const availableYears = Object.keys(vacationData)
console.log(`✅ Available school years: ${availableYears.join(', ')}`)

// Test 3: Vacation day detection
const testDates = [
  new Date('2025-09-23'), // Rosh Hashana
  new Date('2025-10-01'), // Yom Kippur
  new Date('2025-10-07'), // Sukkot
  new Date('2025-12-18'), // Chanukah
  new Date('2026-03-03'), // Purim
  new Date('2026-03-25'), // Passover
  new Date('2025-11-15'), // Regular school day
  new Date('2025-12-01'), // Regular school day
]

console.log('\n📅 Vacation Day Tests:')
testDates.forEach(date => {
  const isVacation = calendar.isVacationDay(date)
  const vacationPeriod = calendar.getVacationPeriod(date)
  const status = isVacation ? '🏖️  VACATION' : '🎓 SCHOOL DAY'
  const vacationName = vacationPeriod ? ` (${vacationPeriod.name})` : ''

  console.log(`${date.toLocaleDateString('en-GB')}: ${status}${vacationName}`)
})

// Test 4: Vacation periods summary
console.log('\n📋 All Vacation Periods for 2025-2026:')
if (vacationData['2025-2026']) {
  vacationData['2025-2026'].vacationPeriods.forEach(vacation => {
    console.log(`  • ${vacation.name}: ${vacation.start} - ${vacation.end}`)
  })
} else {
  console.log('  ❌ No data for 2025-2026')
}

console.log('\n🎯 Integration Test Complete!')
console.log('If you see vacation days detected correctly, the integration is working! ✨')