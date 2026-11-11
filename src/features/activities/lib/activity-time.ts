/**
 * Rentang jam aktivitas, atau null kalau aktivitas memang tanpa jam.
 *
 * Dipakai untuk menyembunyikan baris jam, bukan menampilkan "--:--".
 */
export function formatActivityTime(
  start: string | null,
  end: string | null
): string | null {
  if (!start) return null

  const from = start.slice(0, 5)
  const to = end?.slice(0, 5)

  return to ? `${from} – ${to}` : from
}
