const GIS_SRC = 'https://accounts.google.com/gsi/client'

export const GOOGLE_TASKS_SCOPE = 'https://www.googleapis.com/auth/tasks.readonly'

const TASKS_API = 'https://tasks.googleapis.com/tasks/v1'

type TokenResponse = {
  access_token?: string
  expires_in?: number
  error?: string
}

type TokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void
}

type GoogleOAuth2 = {
  initTokenClient: (config: {
    client_id: string
    scope: string
    callback: (response: TokenResponse) => void
    error_callback?: (error: unknown) => void
  }) => TokenClient
  revoke?: (token: string) => void
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } }
  }
}

export type GoogleTaskList = {
  id: string
  title: string
}

export type GoogleTask = {
  id?: string
  title?: string
  notes?: string
  due?: string
  status?: string
  completed?: string
  deleted?: boolean
}

type TaskListResponse = {
  items?: Array<{ id?: string; title?: string }>
}

type TaskResponse = {
  items?: GoogleTask[]
  nextPageToken?: string
}

/** Client ID OAuth dari env; null kalau belum dikonfigurasi. */
export function getGoogleClientId(): string | null {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  return clientId?.trim() ? clientId.trim() : null
}

async function loadGoogleIdentity(): Promise<GoogleOAuth2> {
  if (window.google?.accounts?.oauth2) return window.google.accounts.oauth2

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`
    )

    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () =>
        reject(new Error('Gagal memuat Google Identity Services.'))
      )
      return
    }

    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('Gagal memuat Google Identity Services.'))
    document.head.appendChild(script)
  })

  const oauth2 = window.google?.accounts?.oauth2
  if (!oauth2) {
    throw new Error('Google Identity Services tidak tersedia di browser ini.')
  }

  return oauth2
}

let cachedToken: { token: string; expiresAt: number } | null = null

function requestToken(clientId: string): Promise<{
  token: string
  expiresAt: number
}> {
  return loadGoogleIdentity().then(
    (oauth2) =>
      new Promise((resolve, reject) => {
        const client = oauth2.initTokenClient({
          client_id: clientId,
          scope: GOOGLE_TASKS_SCOPE,
          callback: (response) => {
            if (response.error || !response.access_token) {
              reject(new Error(response.error ?? 'Izin Google ditolak.'))
              return
            }

            resolve({
              token: response.access_token,
              // Kurangi sedikit supaya tidak dipakai tepat saat kedaluwarsa.
              expiresAt:
                Date.now() + (response.expires_in ?? 3600) * 1000 - 60_000,
            })
          },
          error_callback: () => {
            reject(new Error('Jendela izin Google ditutup sebelum selesai.'))
          },
        })

        client.requestAccessToken({ prompt: '' })
      })
  )
}

/**
 * Access token Google Tasks. Disimpan di memori saja (berlaku ~1 jam), jadi
 * tidak pernah menyentuh localStorage.
 */
export async function getTasksToken(clientId: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const fresh = await requestToken(clientId)
  cachedToken = fresh
  return fresh.token
}

export function forgetTasksToken(): void {
  cachedToken = null
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string }
    }
    if (body.error?.message) return body.error.message
  } catch {
    /* body bukan JSON */
  }

  return `Google menolak permintaan (HTTP ${response.status}).`
}

export async function listTaskLists(token: string): Promise<GoogleTaskList[]> {
  const response = await fetch(`${TASKS_API}/users/@me/lists?maxResults=100`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) throw new Error(await readError(response))

  const data = (await response.json()) as TaskListResponse

  return (data.items ?? [])
    .filter(
      (item): item is { id: string; title?: string } =>
        typeof item.id === 'string'
    )
    .map((item) => ({ id: item.id, title: item.title?.trim() || 'Tanpa nama' }))
}

/** Semua task pada satu list, termasuk yang sudah selesai dan tersembunyi. */
export async function listTasks(
  token: string,
  listId: string
): Promise<GoogleTask[]> {
  const tasks: GoogleTask[] = []
  let pageToken: string | undefined

  do {
    const url = new URL(`${TASKS_API}/lists/${encodeURIComponent(listId)}/tasks`)
    url.searchParams.set('maxResults', '100')
    url.searchParams.set('showCompleted', 'true')
    url.searchParams.set('showHidden', 'true')
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) throw new Error(await readError(response))

    const data = (await response.json()) as TaskResponse
    tasks.push(...(data.items ?? []))
    pageToken = data.nextPageToken
  } while (pageToken)

  return tasks
}
