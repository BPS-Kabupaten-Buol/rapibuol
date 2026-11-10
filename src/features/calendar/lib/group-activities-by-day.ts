import { addDays, format, isAfter, parseISO } from 'date-fns'
import { type Activity } from '@/features/activities/data/schema'

/** Guards against a bad end_date stretching one activity across years. */
const MAX_RANGE_DAYS = 62

function parseDateOnly(value: string | null): Date | null {
  if (!value) return null

  const date = parseISO(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Maps "yyyy-MM-dd" to the activities on that day.
 * Multi-day activities (date..end_date) are listed on every day they span.
 * Activities without a start time sort last within their day.
 */
export function groupActivitiesByDay(
  activities: Activity[]
): Map<string, Activity[]> {
  const byDay = new Map<string, Activity[]>()

  for (const activity of activities) {
    const start = parseDateOnly(activity.date)
    if (!start) continue

    const end = parseDateOnly(activity.end_date)
    const lastDay = end && isAfter(end, start) ? end : start

    for (
      let day = start, guard = 0;
      !isAfter(day, lastDay);
      day = addDays(day, 1)
    ) {
      if (guard++ >= MAX_RANGE_DAYS) break

      const key = format(day, 'yyyy-MM-dd')
      const list = byDay.get(key)

      if (list) list.push(activity)
      else byDay.set(key, [activity])
    }
  }

  for (const list of byDay.values()) {
    list.sort((a, b) =>
      (a.start_time ?? '99:99').localeCompare(b.start_time ?? '99:99')
    )
  }

  return byDay
}
