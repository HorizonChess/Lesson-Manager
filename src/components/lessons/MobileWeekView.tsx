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

// Show 4 days: from Sunday to Wednesday
MobileWeekView.range = (date: Date, { localizer }: any) => {
  const start = localizer.startOf(date, 'week') // Sunday
  const end = localizer.add(start, 3, 'day') // Wednesday

  let current = start
  const range = []

  while (localizer.lte(current, end, 'day')) {
    range.push(current)
    current = localizer.add(current, 1, 'day')
  }

  return range
}

MobileWeekView.navigate = (date: Date, action: any, { localizer }: any) => {
  switch (action) {
    case Navigate.PREVIOUS:
      return localizer.add(date, -7, 'day')

    case Navigate.NEXT:
      return localizer.add(date, 7, 'day')

    default:
      return date
  }
}

MobileWeekView.title = (date: Date, { localizer }: any) => {
  const [start, ...rest] = MobileWeekView.range(date, { localizer })
  return localizer.format({ start, end: rest.pop() }, 'dayRangeHeaderFormat')
}
