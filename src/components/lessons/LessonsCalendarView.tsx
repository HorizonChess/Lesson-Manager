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
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded text-sm transition-all hover:scale-105 active:scale-95"
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
                background: #ffffff;
              }
              .dark .rbc-calendar {
                background: #0f172a;
              }
              .rbc-calendar *,
              .rbc-calendar *::before,
              .rbc-calendar *::after {
                border-color: rgba(229, 231, 235, 0.25) !important;
              }
              .dark .rbc-calendar *,
              .dark .rbc-calendar *::before,
              .dark .rbc-calendar *::after {
                border-color: rgba(75, 85, 99, 0.25) !important;
              }
              .rbc-toolbar {
                display: none;
              }
              .rbc-time-view {
                min-height: 600px;
                border: 1px solid rgba(229, 231, 235, 0.25) !important;
              }
              .dark .rbc-time-view {
                border: 1px solid rgba(75, 85, 99, 0.25) !important;
              }
              .rbc-time-slot {
                border-top: 1px solid rgba(229, 231, 235, 0.6);
                transition: background-color 0.15s ease;
              }
              .rbc-time-slot:hover {
                background-color: rgba(59, 130, 246, 0.02);
              }
              .dark .rbc-time-slot {
                border-top: 1px solid rgba(75, 85, 99, 0.3);
              }
              .dark .rbc-time-slot:hover {
                background-color: rgba(59, 130, 246, 0.05);
              }
              .rbc-time-slot:nth-child(even) {
                border-top: 1px dashed rgba(229, 231, 235, 0.4);
              }
              .dark .rbc-time-slot:nth-child(even) {
                border-top: 1px dashed rgba(75, 85, 99, 0.2);
              }
              .rbc-timeslot-group {
                min-height: 40px;
                border-color: rgba(229, 231, 235, 0.6);
              }
              .dark .rbc-timeslot-group {
                border-color: rgba(75, 85, 99, 0.3);
              }
              .rbc-event {
                border-radius: 6px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                border: none;
              }
              .rbc-event:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .dark .rbc-event {
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
              }
              .dark .rbc-event:hover {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3);
              }
              .rbc-time-header-content {
                border-left: none !important;
              }
              .rbc-header {
                font-weight: 700;
                padding: 12px 8px;
                background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
                border-bottom: 1px solid rgba(229, 231, 235, 0.3) !important;
                border-left: none !important;
                border-right: none !important;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                color: #1f2937;
                position: relative;
              }
              .rbc-header::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 1px;
                background: rgba(229, 231, 235, 0.3);
              }
              .rbc-header:first-child::before {
                display: none;
              }
              .dark .rbc-header {
                background: linear-gradient(to bottom, #1f2937, #111827);
                border-bottom: 1px solid rgba(75, 85, 99, 0.2) !important;
                color: #f3f4f6;
              }
              .dark .rbc-header::before {
                background: rgba(75, 85, 99, 0.2);
              }
              .rbc-time-content {
                border-top: none !important;
              }
              .rbc-time-column {
                position: relative;
              }
              .rbc-time-column::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 1px;
                background: rgba(229, 231, 235, 0.3);
              }
              .rbc-time-column:first-child::before {
                display: none;
              }
              .dark .rbc-time-column::before {
                background: rgba(75, 85, 99, 0.2);
              }
              .rbc-time-header-gutter,
              .rbc-time-gutter {
                background: linear-gradient(to right, #fafafa, #f5f5f5);
                border-right: 1px solid rgba(229, 231, 235, 0.3);
                color: #6b7280;
                font-size: 0.875rem;
              }
              .dark .rbc-time-header-gutter,
              .dark .rbc-time-gutter {
                background: linear-gradient(to right, #1f2937, #111827);
                border-right: 1px solid rgba(75, 85, 99, 0.2);
                color: #9ca3af;
              }
              .rbc-day-slot .rbc-time-slot {
                border-color: rgba(229, 231, 235, 0.4);
              }
              .dark .rbc-day-slot .rbc-time-slot {
                border-color: rgba(75, 85, 99, 0.25);
              }
              .rbc-current-time-indicator {
                background-color: #ef4444;
                height: 2px;
              }
              .dark .rbc-current-time-indicator {
                background-color: #f87171;
              }
              .vacation-day {
                background-color: #fef3c7 !important;
                background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,.08) 10px, rgba(0,0,0,.08) 20px) !important;
              }
              .dark .vacation-day {
                background-color: #78350f !important;
                background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px) !important;
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
