import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  isAfter,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { type Activity } from '../data/schema'

export type DatePreset = 'today' | 'week' | 'month'

export type DatePeriod = {
  year: number
  /** 1-12 */
  month: number
}

export type DateRange = {
  start: Date
  end: Date
}

export function getPresetRange(
  preset: DatePreset,
  now = new Date()
): DateRange {
  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) }
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      }
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) }
  }
}

export function getMonthRange(period: DatePeriod): DateRange {
  const anchor = new Date(period.year, period.month - 1, 1)
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) }
}

/**
 * Rentang tanggal sebuah aktivitas. end_date yang lebih awal dari tanggal
 * mulai dianggap aktivitas satu hari.
 */
export function getActivityRange(activity: Activity): DateRange {
  const start = startOfDay(parseISO(activity.date))
  const endDate = activity.end_date ? parseISO(activity.end_date) : null

  return {
    start,
    end:
      endDate && isAfter(endDate, start) ? endOfDay(endDate) : endOfDay(start),
  }
}

/**
 * Aktivitas lolos filter kalau rentangnya beririsan dengan rentang filter.
 * Jadi kegiatan 9–10 November tetap muncul pada filter "Hari Ini" tanggal 10.
 */
export function isActivityWithinRange(
  activity: Activity,
  range: DateRange
): boolean {
  const activityRange = getActivityRange(activity)
  return activityRange.start <= range.end && activityRange.end >= range.start
}

/**
 * Versi string ("yyyy-MM-dd") dari {@link isActivityWithinRange}, dipakai untuk
 * data yang belum di-parse jadi Date.
 */
export function overlapsIsoRange(
  startDate: string,
  endDate: string | null,
  rangeStart: string,
  rangeEnd: string
): boolean {
  const lastDay = endDate && endDate > startDate ? endDate : startDate
  return startDate <= rangeEnd && lastDay >= rangeStart
}

/**
 * Filter PostgREST untuk rentang yang beririsan; pasangkan dengan
 * `.lte('date', rangeEnd)`. Baris dengan end_date NULL dianggap satu hari.
 *
 * Contoh hasil: `end_date.gte.2026-11-01,and(end_date.is.null,date.gte.2026-11-01)`
 */
export function buildActivityOverlapOr(rangeStart: string): string {
  return `end_date.gte.${rangeStart},and(end_date.is.null,date.gte.${rangeStart})`
}
