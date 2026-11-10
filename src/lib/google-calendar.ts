import {
  getCalendarEventWindow,
  truncate,
  type CalendarEventInput,
} from './calendar-event'

const CALENDAR_TEMPLATE_URL = 'https://calendar.google.com/calendar/render'
const MAX_TITLE_LENGTH = 200
const MAX_DETAILS_LENGTH = 900
const MAX_LOCATION_LENGTH = 300

/**
 * Builds a Google Calendar "add event" link for the TEMPLATE action.
 * Returns null when the date cannot be parsed, so callers can hide the action.
 */
export function buildGoogleCalendarUrl(
  event: CalendarEventInput
): string | null {
  const window = getCalendarEventWindow(event)
  if (!window) return null

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: truncate(event.title, MAX_TITLE_LENGTH),
    dates: `${window.start}/${window.end}`,
  })

  const details = truncate(
    (event.details ?? []).filter((line) => line.trim().length > 0).join('\n'),
    MAX_DETAILS_LENGTH
  )
  if (details) params.set('details', details)

  if (event.location) {
    params.set('location', truncate(event.location, MAX_LOCATION_LENGTH))
  }

  return `${CALENDAR_TEMPLATE_URL}?${params.toString().replace(/\+/g, '%20')}`
}
