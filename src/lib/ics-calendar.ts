import {
  getCalendarEventWindow,
  toUtcStamp,
  truncate,
  type CalendarEventInput,
} from './calendar-event'

export type IcsEventItem = {
  uid: string
  event: CalendarEventInput
}

const MAX_SUMMARY_LENGTH = 200
const LINE_LENGTH = 73

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function foldLine(line: string): string {
  if (line.length <= LINE_LENGTH) return line

  const parts: string[] = []
  let rest = line
  while (rest.length > LINE_LENGTH) {
    parts.push(rest.slice(0, LINE_LENGTH))
    rest = rest.slice(LINE_LENGTH)
  }
  parts.push(rest)

  return parts.join('\r\n ')
}

/**
 * Builds one iCalendar (RFC 5545) file holding every event, so a batch of
 * activities can be imported into Google Calendar in a single step.
 * Items with an unparsable date are skipped.
 */
export function buildIcsCalendar(items: IcsEventItem[]): string {
  const stamp = toUtcStamp(new Date())

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RapiBuol//RapiBuol//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const { uid, event } of items) {
    const window = getCalendarEventWindow(event)
    if (!window) continue

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${escapeText(uid)}`)
    lines.push(`DTSTAMP:${stamp}`)

    if (window.kind === 'timed') {
      lines.push(`DTSTART:${window.start}`)
      lines.push(`DTEND:${window.end}`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${window.start}`)
      lines.push(`DTEND;VALUE=DATE:${window.end}`)
    }

    lines.push(
      `SUMMARY:${escapeText(truncate(event.title, MAX_SUMMARY_LENGTH))}`
    )

    const details = (event.details ?? [])
      .filter((line) => line.trim().length > 0)
      .join('\n')
    if (details) lines.push(`DESCRIPTION:${escapeText(details)}`)
    if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`)

    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return `${lines.map(foldLine).join('\r\n')}\r\n`
}
