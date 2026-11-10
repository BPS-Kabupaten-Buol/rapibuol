/**
 * Pesan bantuan saat sebuah kolom belum ada di tabel `activities`, biasanya
 * karena migrasi di docs/migrations belum dijalankan di Supabase.
 */
export function isMissingColumn(error: unknown, column: string): boolean {
  if (!error || typeof error !== 'object') return false

  const code = (error as { code?: string }).code
  const message = (error as { message?: string }).message ?? ''

  // PGRST204 = kolom tidak ada di schema cache PostgREST,
  // 42703 = undefined_column dari Postgres.
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    message.toLowerCase().includes(column.toLowerCase())
  )
}

export function missingColumnHint(column: string, migrationPath: string): string {
  return `Kolom "${column}" belum ada di tabel activities. Jalankan migrasi ${migrationPath} di Supabase, lalu coba lagi.`
}
