import { type CalendarEventInput } from '@/lib/calendar-event'
import { buildGoogleCalendarUrl } from '@/lib/google-calendar'
import { type Activity } from '../data/schema'

type ActivityCalendarOptions = {
  unitName?: string | null
  teamName?: string | null
}

/** Maps one logged activity to the shared calendar event shape. */
export function toActivityCalendarInput(
  activity: Activity,
  { unitName, teamName }: ActivityCalendarOptions = {}
): CalendarEventInput {
  const details = [`Status: ${activity.is_done ? 'Selesai' : 'Belum selesai'}`]

  if (activity.volume !== null) {
    details.push(`Volume: ${activity.volume}${unitName ? ` ${unitName}` : ''}`)
  }
  if (teamName) details.push(`Tim: ${teamName}`)
  if (activity.link_bukti_dukung) {
    details.push(`Bukti dukung: ${activity.link_bukti_dukung}`)
  }
  details.push('Dibuat dari RapiBuol')

  return {
    title: activity.description,
    date: activity.date,
    endDate: activity.end_date,
    startTime: activity.start_time,
    endTime: activity.end_time,
    details,
    location: activity.coordinates,
  }
}

/**
 * Google Calendar "add event" link for one logged activity.
 * Returns null when the activity has no usable date.
 */
export function getActivityCalendarUrl(
  activity: Activity,
  options: ActivityCalendarOptions = {}
): string | null {
  return buildGoogleCalendarUrl(toActivityCalendarInput(activity, options))
}
