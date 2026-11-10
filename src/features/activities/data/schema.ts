import { z } from 'zod'

/** Kuadran Eisenhower yang dipakai halaman board. */
export const ACTIVITY_QUADRANTS = [
  'do-first',
  'schedule',
  'delegate',
  'eliminate',
] as const

export type ActivityQuadrant = (typeof ACTIVITY_QUADRANTS)[number]

export const activitySchema = z.object({
  id: z.number(),
  description: z.string(),
  date: z.string(),
  end_date: z.string().nullable(),
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
  volume: z.number().nullable(),
  unit: z.number().nullable(),
  assignor: z.number().nullable(),
  is_done: z.boolean(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  user_id: z.string(),
  link_bukti_dukung: z.string().nullable(),
  coordinates: z.string().nullable(),
  // Nullable + optional supaya baris lama (sebelum migrasi) tetap valid.
  quadrant: z.enum(ACTIVITY_QUADRANTS).nullish(),
})

export type Activity = z.infer<typeof activitySchema>

export type CreateActivityInput = {
  description: string
  date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  volume: number | null
  unit: number | null
  assignor: number | null
  is_done: boolean
  user_id: string
  link_bukti_dukung: string | null
  coordinates: string | null
  quadrant?: ActivityQuadrant | null
}

export type UpdateActivityInput = Partial<CreateActivityInput>
