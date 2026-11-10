import { format } from 'date-fns'
import { buildIcsCalendar } from '@/lib/ics-calendar'
import { type Team } from '@/features/teams/api/teams'
import { type Unit } from '@/features/units/api/units'
import { type Activity } from '../data/schema'
import { toActivityCalendarInput } from './google-calendar-link'

/**
 * Downloads one .ics file holding all given activities.
 * Opening the file lets Google Calendar import every event at once.
 */
export function downloadActivitiesIcs(
  activities: Activity[],
  teams: Team[],
  units: Unit[]
): void {
  const items = activities.map((activity) => ({
    uid: `activity-${activity.id}@rapibuol`,
    event: toActivityCalendarInput(activity, {
      unitName: units.find((unit) => unit.id === activity.unit)?.name ?? null,
      teamName:
        teams.find((team) => team.id === activity.assignor)?.name ?? null,
    }),
  }))

  const blob = new Blob([buildIcsCalendar(items)], {
    type: 'text/calendar;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `aktivitas-${format(new Date(), 'yyyy-MM-dd')}.ics`
  link.click()

  URL.revokeObjectURL(url)
}
