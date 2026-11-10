import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  isAfter,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { type Activity } from '@/features/activities/data/schema'

const WEEK_STARTS_ON = 1

/** Guards against a bad end_date stretching one activity across years. */
const MAX_RANGE_DAYS = 62

/** Jumlah baris event yang muat dalam satu minggu sebelum diringkas jadi "+N". */
export const MAX_LANES = 3

export type WeekBar = {
  activity: Activity
  startCol: number
  endCol: number
  lane: number
  /** Event mulai sebelum minggu ini, jadi ujung kirinya tidak dibulatkan. */
  continuesBefore: boolean
  /** Event berlanjut ke minggu berikutnya, jadi ujung kanannya tidak dibulatkan. */
  continuesAfter: boolean
  isMultiDay: boolean
}

export type WeekOverflow = {
  col: number
  count: number
}

export type CalendarWeek = {
  days: Date[]
  bars: WeekBar[]
  overflow: WeekOverflow[]
  laneCount: number
}

function parseDateOnly(value: string | null): Date | null {
  if (!value) return null

  const date = parseISO(value)
  return Number.isNaN(date.getTime()) ? null : date
}

type ActivitySpan = {
  activity: Activity
  start: Date
  end: Date
}

function activitySpans(activities: Activity[]): ActivitySpan[] {
  const spans: ActivitySpan[] = []

  for (const activity of activities) {
    const start = parseDateOnly(activity.date)
    if (!start) continue

    const end = parseDateOnly(activity.end_date)
    let lastDay = end && isAfter(end, start) ? end : start

    if (differenceInCalendarDays(lastDay, start) >= MAX_RANGE_DAYS) {
      lastDay = addDays(start, MAX_RANGE_DAYS - 1)
    }

    spans.push({ activity, start, end: lastDay })
  }

  return spans
}

/**
 * Menyusun baris event per minggu untuk tampilan bulan.
 *
 * Setiap aktivitas dipotong menjadi satu segmen per minggu, lalu ditempatkan di
 * lajur (lane) pertama yang masih kosong. Segmen yang tidak kebagian lajur
 * dihitung sebagai "+N lagi" pada kolomnya.
 */
export function buildMonthWeeks(
  month: Date,
  activities: Activity[],
  maxLanes = MAX_LANES
): CalendarWeek[] {
  const gridStart = startOfWeek(startOfMonth(month), {
    weekStartsOn: WEEK_STARTS_ON,
  })
  const gridEnd = endOfWeek(endOfMonth(month), {
    weekStartsOn: WEEK_STARTS_ON,
  })

  const spans = activitySpans(activities)
  const weeks: CalendarWeek[] = []

  for (
    let weekStart = gridStart;
    !isAfter(weekStart, gridEnd);
    weekStart = addDays(weekStart, 7)
  ) {
    const weekEnd = addDays(weekStart, 6)

    const candidates = spans
      .filter(
        (span) => !isAfter(span.start, weekEnd) && !isAfter(weekStart, span.end)
      )
      .map((span) => ({
        span,
        startCol: Math.max(
          0,
          differenceInCalendarDays(span.start, weekStart)
        ),
        endCol: Math.min(6, differenceInCalendarDays(span.end, weekStart)),
        continuesBefore: isAfter(weekStart, span.start),
        continuesAfter: isAfter(span.end, weekEnd),
      }))
      .sort((a, b) => {
        if (a.startCol !== b.startCol) return a.startCol - b.startCol

        const lengthDiff =
          b.endCol - b.startCol - (a.endCol - a.startCol)
        if (lengthDiff !== 0) return lengthDiff

        return (a.span.activity.start_time ?? '99:99').localeCompare(
          b.span.activity.start_time ?? '99:99'
        )
      })

    const lanes: Array<Array<{ from: number; to: number }>> = []
    const bars: WeekBar[] = []
    const overflow = new Map<number, number>()

    for (const candidate of candidates) {
      let lane = -1

      for (let index = 0; index < maxLanes; index++) {
        const occupied = lanes[index] ?? []
        const clash = occupied.some(
          (item) => candidate.startCol <= item.to && candidate.endCol >= item.from
        )

        if (!clash) {
          lane = index
          break
        }
      }

      if (lane === -1) {
        for (let col = candidate.startCol; col <= candidate.endCol; col++) {
          overflow.set(col, (overflow.get(col) ?? 0) + 1)
        }
        continue
      }

      if (!lanes[lane]) lanes[lane] = []
      lanes[lane].push({ from: candidate.startCol, to: candidate.endCol })

      bars.push({
        activity: candidate.span.activity,
        startCol: candidate.startCol,
        endCol: candidate.endCol,
        lane,
        continuesBefore: candidate.continuesBefore,
        continuesAfter: candidate.continuesAfter,
        isMultiDay:
          differenceInCalendarDays(candidate.span.end, candidate.span.start) > 0,
      })
    }

    weeks.push({
      days: Array.from({ length: 7 }, (_, index) =>
        addDays(weekStart, index)
      ),
      bars,
      overflow: Array.from(overflow.entries())
        .map(([col, count]) => ({ col, count }))
        .sort((a, b) => a.col - b.col),
      laneCount: lanes.filter((lane) => lane && lane.length > 0).length,
    })
  }

  return weeks
}
