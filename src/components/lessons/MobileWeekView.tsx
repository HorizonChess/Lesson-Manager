import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Navigate } from 'react-big-calendar'
import TimeGrid from 'react-big-calendar/lib/TimeGrid'

export default function MobileWeekView({
  date,
  localizer,
  max = localizer.endOf(new Date(), 'day'),
  min = localizer.startOf(new Date(), 'day'),
  scrollToTime = localizer.startOf(new Date(), 'day'),
  ...props
}: any) {
  const currRange = useMemo(
    () => MobileWeekView.range(date, { localizer }),
    [date, localizer]
  )

  return (
    <TimeGrid
      date={date}
      eventOffset={15}
      localizer={localizer}
      max={max}
      min={min}
      range={currRange}
      scrollToTime={scrollToTime}
      {...props}
    />
  )
}

MobileWeekView.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
  localizer: PropTypes.object,
  max: PropTypes.instanceOf(Date),
  min: PropTypes.instanceOf(Date),
  scrollToTime: PropTypes.instanceOf(Date),
}

// Show 4 days: first half (Sun-Wed) or second half (Thu-Sat) based on current date
MobileWeekView.range = (date: Date, { localizer }: any) => {
  const weekStart = localizer.startOf(date, 'week') // Sunday
  const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday

  // If it's Thursday (4), Friday (5), or Saturday (6), show the second half (Thu-Sat)
  // Otherwise show the first half (Sun-Wed)
  const showSecondHalf = dayOfWeek >= 4

  const start = showSecondHalf
    ? localizer.add(weekStart, 4, 'day') // Thursday (start of second half)
    : weekStart // Sunday (start of first half)

  let current = start
  const range = []

  // Show 4 days for first half (Sun-Wed), 3 days for second half (Thu-Sat)
  const daysToShow = showSecondHalf ? 3 : 4

  for (let i = 0; i < daysToShow; i++) {
    range.push(current)
    current = localizer.add(current, 1, 'day')
  }

  return range
}

MobileWeekView.navigate = (date: Date, action: any, { localizer }: any) => {
  // Get the current visible range to determine which half we're viewing
  const currentRange = MobileWeekView.range(date, { localizer })
  const firstVisibleDate = currentRange[0]

  // Determine if we're viewing the second half based on the first visible date's day of week
  const firstDayOfWeek = firstVisibleDate.getDay()
  const isInSecondHalf = firstDayOfWeek >= 4

  // Get the week start of the first visible date
  const weekStart = localizer.startOf(firstVisibleDate, 'week')

  switch (action) {
    case Navigate.PREVIOUS:
      if (isInSecondHalf) {
        // From second half (Thu-Sat) go to first half of same week (Sun)
        return weekStart
      } else {
        // From first half (Sun-Wed) go to second half of previous week (Thu)
        return localizer.add(weekStart, -3, 'day') // Previous Thursday
      }

    case Navigate.NEXT:
      if (isInSecondHalf) {
        // From second half (Thu-Sat) go to first half of next week (Sun)
        return localizer.add(weekStart, 7, 'day') // Next Sunday
      } else {
        // From first half (Sun-Wed) go to second half of same week (Thu)
        return localizer.add(weekStart, 4, 'day') // This Thursday
      }

    default:
      return date
  }
}

MobileWeekView.title = (date: Date, { localizer }: any) => {
  const [start, ...rest] = MobileWeekView.range(date, { localizer })
  return localizer.format({ start, end: rest.pop() }, 'dayRangeHeaderFormat')
}
