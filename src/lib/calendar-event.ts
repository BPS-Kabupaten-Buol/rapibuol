const DEFAULT_EVENT_MINUTES = 60

export type CalendarEventInput = {
  title: string
  /** yyyy-MM-dd */
  date: string
  /** yyyy-MM-dd, optional multi-day event */
  endDate?: string | null
  /** HH:mm or HH:mm:ss, local wall clock */
  startTime?: string | null
  endTime?: string | null
  details?: string[]
  location?: string | null
}

export type CalendarEventWindow =
  | { kind: 'timed'; start: string; end: string }
  | { kind: 'allDay'; start: string; end: string }

type DayParts = { year: number; month: number; day: number }
type TimeParts = { hours: number; minutes: number }

function parseDay(value: string | null | undefined): DayParts | null {
  if (!value) return null

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  // Rejects 2026-02-31 and similar: the built Date would roll over.
  const probe = new Date(year, month - 1, day)
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    return null
  }

  return { year, month, day }
}

function parseTime(value: string | null | undefined): TimeParts | null {
  if (!value) return null

  const match = /^(\d{1,2}):(\d{2})/.exec(value)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null

  return { hours, minutes }
}

function toDayStamp({ year, month, day }: DayParts): string {
  return `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`
}

function addDays({ year, month, day }: DayParts, days: number): DayParts {
  const shifted = new Date(year, month - 1, day + days)
  return {
    year: shifted.getFullYear(),
    month: shifted.getMonth() + 1,
    day: shifted.getDate(),
  }
}

/** Local wall clock to calendar stamp (yyyyMMddTHHmmssZ). */
export function toUtcStamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
}

export function truncate(value: string, max: number): string {
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 3).trimEnd()}...`
}

/**
 * Start/end of the calendar event for one item.
 * Timed events are converted to UTC from the browser's local wall clock;
 * items without a start time become all-day events with an exclusive end date.
 * Returns null when the date cannot be parsed.
 */
export function getCalendarEventWindow(
  event: CalendarEventInput
): CalendarEventWindow | null {
  const startDay = parseDay(event.date)
  if (!startDay) return null

  const endDay = parseDay(event.endDate)
  const lastDay =
    endDay && toDayStamp(endDay) >= toDayStamp(startDay) ? endDay : startDay

  const startTime = parseTime(event.startTime)
  const endTime = parseTime(event.endTime)

  if (!startTime) {
    return {
      kind: 'allDay',
      start: toDayStamp(startDay),
      end: toDayStamp(addDays(lastDay, 1)),
    }
  }

  const start = new Date(
    startDay.year,
    startDay.month - 1,
    startDay.day,
    startTime.hours,
    startTime.minutes
  )
  const end = new Date(
    lastDay.year,
    lastDay.month - 1,
    lastDay.day,
    endTime?.hours ?? startTime.hours,
    endTime?.minutes ?? startTime.minutes
  )

  if (end.getTime() <= start.getTime()) {
    end.setTime(start.getTime() + DEFAULT_EVENT_MINUTES * 60 * 1000)
  }

  return { kind: 'timed', start: toUtcStamp(start), end: toUtcStamp(end) }
}
