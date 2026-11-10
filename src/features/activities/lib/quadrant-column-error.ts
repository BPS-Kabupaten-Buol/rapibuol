/**
 * Pesan bantuan saat tabel `activities` belum punya kolom `quadrant`.
 * Muncul kalau migrasi docs/migrations/2026-11-10-activity-quadrant.sql
 * belum dijalankan di Supabase.
 */
export const MISSING_QUADRANT_COLUMN_HINT =
  'Kolom "quadrant" belum ada di tabel activities. Jalankan migrasi docs/migrations/2026-11-10-activity-quadrant.sql di Supabase, lalu coba lagi.'

export function isMissingQuadrantColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const code = (error as { code?: string }).code
  const message = (error as { message?: string }).message ?? ''

  return code === 'PGRST204' || code === '42703' || /quadrant/i.test(message)
}
