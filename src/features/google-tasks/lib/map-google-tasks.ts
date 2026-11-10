import { type GoogleTask } from '../api/google-tasks'

export const GOOGLE_TASK_PREFIX = 'google-task:'

export type GoogleTaskActivity = {
  externalId: string
  description: string
  date: string
  isDone: boolean
}

export type MapGoogleTasksResult = {
  rows: GoogleTaskActivity[]
  /** Task tanpa tanggal jatuh tempo, tidak bisa dipetakan ke aktivitas. */
  skippedNoDue: number
  /** Task tanpa judul / id, atau tanggalnya tidak valid. */
  skippedInvalid: number
  completedCount: number
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Google Tasks hanya menyimpan tanggal jatuh tempo (`due`, RFC3339 pada 00:00
 * UTC), jadi aktivitas hasil impor tidak punya jam mulai/selesai.
 */
export function mapGoogleTasks(
  tasks: GoogleTask[]
): MapGoogleTasksResult {
  const rows: GoogleTaskActivity[] = []
  let skippedNoDue = 0
  let skippedInvalid = 0
  let completedCount = 0

  for (const task of tasks) {
    if (task.deleted) continue

    const title = task.title?.trim()
    if (typeof task.id !== 'string' || !title) {
      skippedInvalid++
      continue
    }

    if (!task.due) {
      skippedNoDue++
      continue
    }

    const date = task.due.slice(0, 10)
    if (!ISO_DATE.test(date)) {
      skippedInvalid++
      continue
    }

    const isDone = task.status === 'completed'
    if (isDone) completedCount++

    rows.push({
      externalId: `${GOOGLE_TASK_PREFIX}${task.id}`,
      description: title,
      date,
      isDone,
    })
  }

  rows.sort((a, b) => a.date.localeCompare(b.date))

  return { rows, skippedNoDue, skippedInvalid, completedCount }
}
