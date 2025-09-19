import type { ComponentType } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import moment from 'moment'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)
const DnDCalendar = withDragAndDrop(Calendar as any)
const CalendarComponent = DnDCalendar as ComponentType<any>

export interface LessonsCalendarEvent<TLesson = unknown> {
  id: string
  title: string
  start: Date
  end: Date
  lesson: TLesson
  isVacationDay: boolean
  resource?: Record<string, unknown>
}

interface LessonsCalendarViewProps<TLesson = unknown> {
  currentDate: Date
  onPreviousWeek: () => void
  onToday: () => void
  onNextWeek: () => void
  onNavigate: (date: Date) => void
  events: LessonsCalendarEvent<TLesson>[]
  onSelectEvent: (event: LessonsCalendarEvent<TLesson>) => void
  onSelectSlot: (slotInfo: any) => void
  onEventDrop: (args: { event: LessonsCalendarEvent<TLesson>; start: Date; end: Date }) => void | Promise<void>
  eventPropGetter: (event: LessonsCalendarEvent<TLesson>) => Record<string, unknown>
  dayPropGetter: (date: Date) => Record<string, unknown>
  eventComponent: ComponentType<{ event: LessonsCalendarEvent<TLesson> }>
  timeRangeFormatter: (args: { start: Date; end: Date }) => string
}

export function LessonsCalendarView<TLesson = unknown>({
  currentDate,
  onPreviousWeek,
  onToday,
  onNextWeek,
  onNavigate,
  events,
  onSelectEvent,
  onSelectSlot,
  onEventDrop,
  eventPropGetter,
  dayPropGetter,
  eventComponent,
  timeRangeFormatter
}: LessonsCalendarViewProps<TLesson>) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={onPreviousWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
            title="Previous week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={onToday}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Today
          </button>

          <button
            onClick={onNextWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
            title="Next week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <h3 className="text-lg font-semibold">
          {moment(currentDate).startOf('week').format('MMM D')} - {moment(currentDate).endOf('week').format('MMM D, YYYY')}
        </h3>

        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{
                backgroundColor: '#fef3c7',
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,.1) 4px, rgba(0,0,0,.1) 8px)'
              }}
            />
            <span>Vacation</span>
          </div>
        </div>
      </div>

      <div className="h-[600px]">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .rbc-calendar {
                font-family: inherit;
              }
              .rbc-toolbar {
                display: none;
              }
              .rbc-time-view {
                min-height: 600px;
              }
              .rbc-time-slot {
                border-top: 1px solid #e5e7eb;
              }
              .rbc-time-slot:nth-child(even) {
                border-top: 1px dashed #e5e7eb;
              }
              .rbc-timeslot-group {
                min-height: 40px;
              }
              .rbc-event {
                border-radius: 4px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
              }
              .rbc-event:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
              }
              .rbc-header {
                font-weight: 600;
                padding: 12px 8px;
                background: #f9fafb;
                border-bottom: 2px solid #e5e7eb;
              }
              .dark .rbc-header {
                background: #374151;
                color: #f3f4f6;
              }
              .rbc-time-header-gutter,
              .rbc-time-gutter {
                background: #f9fafb;
                border-right: 2px solid #e5e7eb;
              }
              .dark .rbc-time-header-gutter,
              .dark .rbc-time-gutter {
                background: #374151;
                color: #f3f4f6;
              }
            `
          }}
        />

        <CalendarComponent
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          onNavigate={onNavigate}
          view="week"
          views={['week']}
          step={15}
          timeslots={2}
          min={new Date(0, 0, 0, 7, 0)}
          max={new Date(0, 0, 0, 22, 0)}
          onSelectEvent={(event: unknown) =>
            onSelectEvent(event as LessonsCalendarEvent<TLesson>)
          }
          onSelectSlot={onSelectSlot}
          onEventDrop={({ event, start, end }: { event: unknown; start: unknown; end: unknown }) =>
            onEventDrop({
              event: event as LessonsCalendarEvent<TLesson>,
              start: start instanceof Date ? start : new Date(start as string),
              end: end instanceof Date ? end : new Date(end as string)
            })
          }
          resizable={false}
          selectable
          eventPropGetter={(event: unknown) =>
            eventPropGetter(event as LessonsCalendarEvent<TLesson>)
          }
          dayPropGetter={dayPropGetter}
          components={{ event: eventComponent as ComponentType<any> }}
          formats={{
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: timeRangeFormatter
          }}
        />
      </div>
    </div>
  )
}
