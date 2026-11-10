import { eachDayOfInterval, format, isAfter, isBefore, parseISO } from 'date-fns'

type ActivityLike = {
  date: string
  end_date: string | null
}

/**
 * Menghitung jumlah aktivitas per tanggal ("yyyy-MM-dd").
 *
 * Satu aktivitas dihitung di **setiap** tanggal yang dicakupnya, bukan hanya
 * tanggal mulai — jadi kegiatan 9–10 November menambah hitungan di tanggal 9
 * dan 10. Rentang dipotong ke jendela [windowStart, windowEnd] supaya end_date
 * yang rusak tidak membuat perulangan panjang.
 */
export function countActivitiesPerDay(
  activities: ActivityLike[],
  windowStart: string,
  windowEnd: string
): Record<string, number> {
  const counts: Record<string, number> = {}
  const start = parseISO(windowStart)
  const end = parseISO(windowEnd)

  if (isAfter(start, end)) return counts

  for (const activity of activities) {
    const activityStart = parseISO(activity.date)
    const activityEnd = activity.end_date ? parseISO(activity.end_date) : null
    const lastDay =
      activityEnd && isAfter(activityEnd, activityStart)
        ? activityEnd
        : activityStart

    const from = isAfter(activityStart, start) ? activityStart : start
    const to = isBefore(lastDay, end) ? lastDay : end

    if (isAfter(from, to)) continue

    for (const day of eachDayOfInterval({ start: from, end: to })) {
      const key = format(day, 'yyyy-MM-dd')
      counts[key] = (counts[key] ?? 0) + 1
    }
  }

  return counts
}
