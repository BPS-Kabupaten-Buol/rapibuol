import { toast } from 'sonner'

const ERROR_MESSAGES: Record<string, string> = {
  '42501': 'Anda tidak memiliki akses untuk tindakan ini.',
  '23505': 'Data yang sama sudah ada.',
  '23503': 'Data ini masih dipakai oleh data lain.',
  PGRST301: 'Sesi berakhir. Silakan masuk lagi.',
}

const AUTH_ERROR_CODES = new Set([
  'PGRST301', // JWT expired
  'PGRST302', // JWT missing
  'bad_jwt',
  'session_not_found',
  'refresh_token_not_found',
])

const AUTH_ERROR_NAMES = new Set([
  'AuthSessionMissingError',
  'AuthInvalidTokenResponseError',
  'AuthInvalidJwtError',
])

/**
 * Pulls a readable message out of the errors this app actually throws.
 * Supabase PostgrestError / AuthError / StorageError and plain Error all
 * expose `message`; some server payloads use `title` or `error_description`.
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim()) return error.trim()

  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>

    if (typeof err.code === 'string' && ERROR_MESSAGES[err.code]) {
      return ERROR_MESSAGES[err.code]
    }

    for (const field of ['message', 'details', 'title', 'error_description']) {
      const value = err[field]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
  }

  return 'Terjadi kesalahan. Silakan coba lagi.'
}

/** True when the session is gone or the token is expired, so retrying is pointless. */
export function isAuthFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const err = error as Record<string, unknown>

  if (Number(err.status) === 401) return true
  if (typeof err.code === 'string' && AUTH_ERROR_CODES.has(err.code)) return true
  return typeof err.name === 'string' && AUTH_ERROR_NAMES.has(err.name)
}

export function handleServerError(error: unknown) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(error)
  }

  toast.error(getErrorMessage(error))
}
