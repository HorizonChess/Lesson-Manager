import test from 'node:test'
import assert from 'node:assert/strict'
import {
  analyzeTimeWindow,
  calculateGroupDistribution,
  buildScheduleDetails
} from '../src/lib/scheduling/index.ts'

test('analyzes a perfect match window', () => {
  const result = analyzeTimeWindow('08:00', '09:35', 2)
  assert.equal(result.strategy, 'perfect-match')
  assert.equal(result.academicHours, 2)
  assert.equal(result.periodsInWindow.length, 2)
})

test('falls back to custom-times when outside standard periods', () => {
  const result = analyzeTimeWindow('09:00', '10:00', 1)
  assert.equal(result.strategy, 'partial-match')
  assert.equal(result.periodsInWindow.length, 1)
})

test('distributes extra periods to preferred groups', () => {
  const distribution = calculateGroupDistribution(5, 3, [2, 0])
  assert.deepEqual(distribution, [2, 1, 2])
})

test('builds schedule details with snapping enabled', () => {
  const details = buildScheduleDetails({
    startTime: '10:00',
    endTime: '11:30',
    groupCount: 3,
    preferredGroupForExtraPeriods: [1],
    enableMultiPeriodCustomization: true,
    customGroupDurations: [2, 1, 1],
    mapCustomTimesToPeriods: true
  })

  assert.ok(details.periodsForDistribution.length >= 2)
  assert.equal(details.customDistributionValid, false)
  assert.equal(details.slots.length, 3)
})




