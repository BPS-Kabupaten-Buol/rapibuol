import { addDays, format, parseISO } from 'date-fns'

/**
 * Menggeser tanggal ISO ("yyyy-MM-dd") sebanyak `deltaDays`, termasuk saat
 * melewati batas bulan atau tahun.
 */
export function shiftIsoDate(value: string, deltaDays: number): string {
  return format(addDays(parseISO(value), deltaDays), 'yyyy-MM-dd')
}
