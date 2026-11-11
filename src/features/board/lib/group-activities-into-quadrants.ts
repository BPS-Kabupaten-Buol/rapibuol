import {
  type Activity,
  type ActivityQuadrant,
} from '@/features/activities/data/schema'

export type BoardQuadrant = {
  id: ActivityQuadrant
  title: string
  hint: string
}

/** Empat kuadran Eisenhower, urut sesuai prioritas. */
export const BOARD_QUADRANTS: BoardQuadrant[] = [
  { id: 'do-first', title: 'DO FIRST', hint: 'Urgent & Important' },
  { id: 'schedule', title: 'SCHEDULE', hint: 'Not Urgent & Important' },
  { id: 'delegate', title: 'DELEGATE', hint: 'Urgent & Not Important' },
  {
    id: 'eliminate',
    title: 'ELIMINATE',
    hint: 'Not Urgent & Not Important',
  },
]

export type BoardColumn = BoardQuadrant & {
  activities: Activity[]
}

export type BoardGrouping = {
  columns: BoardColumn[]
  done: Activity[]
}

function sortActivities(activities: Activity[]): void {
  activities.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date)
    if (byDate !== 0) return byDate

    return (a.start_time ?? '99:99').localeCompare(b.start_time ?? '99:99')
  })
}

/**
 * Memisahkan aktivitas ke empat kuadran, dengan yang sudah selesai
 * dikumpulkan terpisah untuk bagian collapsible di bawah board.
 *
 * Aktivitas tanpa kuadran (baris lama) masuk DO FIRST.
 */
export function groupActivitiesIntoQuadrants(
  activities: Activity[]
): BoardGrouping {
  const columns: BoardColumn[] = BOARD_QUADRANTS.map((quadrant) => ({
    ...quadrant,
    activities: [],
  }))
  const byQuadrant = new Map(columns.map((column) => [column.id, column]))
  const done: Activity[] = []

  for (const activity of activities) {
    if (activity.is_done) {
      done.push(activity)
      continue
    }

    // Nilai tak dikenal (mis. data lama) jatuh ke DO FIRST, bukan hilang.
    const column =
      byQuadrant.get(activity.quadrant ?? 'do-first') ??
      byQuadrant.get('do-first')

    column?.activities.push(activity)
  }

  for (const column of columns) sortActivities(column.activities)
  // Yang paling baru di atas pada bagian Selesai.
  sortActivities(done)
  done.reverse()

  return { columns, done }
}
