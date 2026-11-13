/** Batas umur sesi login, terlepas dari masa berlaku token Supabase. */

const DEADLINE_KEY = 'rapibuol_session_deadline'
const DAY_MS = 24 * 60 * 60 * 1000

/** "Remember me" menyimpan sesi sampai 30 hari. */
export const REMEMBER_ME_DAYS = 30
/** Tanpa "remember me", sesi berlaku sehari. */
export const SHORT_SESSION_DAYS = 1

export function setSessionDeadline(
  rememberMe: boolean,
  from: number = Date.now()
): void {
  const days = rememberMe ? REMEMBER_ME_DAYS : SHORT_SESSION_DAYS
  localStorage.setItem(DEADLINE_KEY, String(from + days * DAY_MS))
}

export function getSessionDeadline(): number | null {
  const raw = localStorage.getItem(DEADLINE_KEY)
  if (!raw) return null

  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

export function isSessionExpired(now: number = Date.now()): boolean {
  const deadline = getSessionDeadline()
  return deadline !== null && now >= deadline
}

export function clearSessionDeadline(): void {
  localStorage.removeItem(DEADLINE_KEY)
}
