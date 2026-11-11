import {
  endOfMonth,
  endOfQuarter,
  format,
  isAfter,
  parseISO,
  startOfMonth,
  startOfQuarter,
} from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  isActivityWithinRange,
  type DateRange,
} from '@/features/activities/lib/activity-date-range'
import { type Activity } from '@/features/activities/data/schema'

export type ReportKind = 'monthly' | 'quarterly'

export type ReportPeriod = {
  kind: ReportKind
  year: number
  /** 1-12, dipakai saat kind = 'monthly'. */
  month?: number
  /** 1-4, dipakai saat kind = 'quarterly'. */
  quarter?: number
}

const ROMAN = ['I', 'II', 'III', 'IV']

export function getReportRange(period: ReportPeriod): DateRange {
  if (period.kind === 'monthly') {
    const anchor = new Date(period.year, (period.month ?? 1) - 1, 1)
    return { start: startOfMonth(anchor), end: endOfMonth(anchor) }
  }

  const anchor = new Date(period.year, ((period.quarter ?? 1) - 1) * 3, 1)
  return { start: startOfQuarter(anchor), end: endOfQuarter(anchor) }
}

export function getReportLabel(period: ReportPeriod): string {
  if (period.kind === 'monthly') {
    const anchor = new Date(period.year, (period.month ?? 1) - 1, 1)
    return format(anchor, 'MMMM yyyy', { locale: localeId })
  }

  return `Triwulan ${ROMAN[(period.quarter ?? 1) - 1]} ${period.year}`
}

export function getReportKindLabel(period: ReportPeriod): string {
  return period.kind === 'monthly' ? 'Bulanan' : 'Triwulanan'
}

/**
 * Tanggal untuk kolom rekap. Aktivitas multi-hari ditulis sebagai rentang,
 * misal "9–10 Nov 2026", supaya tidak terbaca sebagai kegiatan satu hari.
 */
export function formatReportDate(
  date: string,
  endDate: string | null
): string {
  const start = parseISO(date)
  const startLabel = format(start, 'd MMM yyyy', { locale: localeId })
  if (!endDate) return startLabel

  const end = parseISO(endDate)
  if (!isAfter(end, start)) return startLabel

  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()

  return sameMonth
    ? `${format(start, 'd', { locale: localeId })}–${format(end, 'd MMM yyyy', { locale: localeId })}`
    : `${format(start, 'd MMM', { locale: localeId })} – ${format(end, 'd MMM yyyy', { locale: localeId })}`
}

export type ReportVolume = {
  unit: string
  total: number
}

export type ReportSummary = {
  total: number
  done: number
  pending: number
  volumes: ReportVolume[]
}

export type ReportData = {
  rows: Activity[]
  summary: ReportSummary
}

function sortRows(a: Activity, b: Activity): number {
  const byDate = a.date.localeCompare(b.date)
  if (byDate !== 0) return byDate

  return (a.start_time ?? '99:99').localeCompare(b.start_time ?? '99:99')
}

/**
 * Menyaring aktivitas yang beririsan dengan periode (kegiatan rentang ikut
 * terhitung) lalu merangkum jumlah dan volume per satuan.
 */
export function buildReport(
  activities: Activity[],
  range: DateRange,
  unitName: (unitId: number | null) => string
): ReportData {
  const rows = activities
    .filter((activity) => isActivityWithinRange(activity, range))
    .sort(sortRows)

  const volumeByUnit = new Map<string, number>()

  for (const activity of rows) {
    if (!activity.volume) continue

    const name = unitName(activity.unit) || 'Tanpa satuan'
    volumeByUnit.set(name, (volumeByUnit.get(name) ?? 0) + activity.volume)
  }

  return {
    rows,
    summary: {
      total: rows.length,
      done: rows.filter((activity) => activity.is_done).length,
      pending: rows.filter((activity) => !activity.is_done).length,
      volumes: Array.from(volumeByUnit.entries())
        .map(([unit, total]) => ({ unit, total }))
        .sort((a, b) => b.total - a.total || a.unit.localeCompare(b.unit)),
    },
  }
}
