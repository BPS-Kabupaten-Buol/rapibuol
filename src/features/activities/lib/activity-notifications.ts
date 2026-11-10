import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { type Activity } from '../data/schema'

export type ActivityNotificationKind = 'overdue' | 'due-today'

export type ActivityNotification = {
  id: number
  kind: ActivityNotificationKind
  title: string
  meta: string
  /** Tenggat "yyyy-MM-dd" yang dipakai; dipakai juga sebagai identitas. */
  deadline: string
}

const KIND_ORDER: Record<ActivityNotificationKind, number> = {
  overdue: 0,
  'due-today': 1,
}

/**
 * Notifikasi yang bisa dihitung tanpa server: aktivitas belum selesai yang
 * sudah lewat tenggat, dan yang tenggatnya hari ini.
 *
 * Tenggat memakai end_date kalau ada, kalau tidak tanggal aktivitasnya.
 */
export function buildActivityNotifications(
  activities: Activity[],
  today = new Date()
): ActivityNotification[] {
  const todayStr = format(today, 'yyyy-MM-dd')
  const items: ActivityNotification[] = []

  for (const activity of activities) {
    if (activity.is_done) continue

    const lastDay =
      activity.end_date && activity.end_date > activity.date
        ? activity.end_date
        : activity.date

    if (lastDay < todayStr) {
      items.push({
        id: activity.id,
        kind: 'overdue',
        title: activity.description,
        meta: `Terlambat, tenggat ${format(parseISO(lastDay), 'd MMM', {
          locale: localeId,
        })}`,
        deadline: lastDay,
      })
      continue
    }

    if (lastDay === todayStr) {
      items.push({
        id: activity.id,
        kind: 'due-today',
        title: activity.description,
        meta: 'Tenggat hari ini',
        deadline: lastDay,
      })
    }
  }

  return items.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind])
}
