import { z } from 'zod'

export const activitySchema = z.object({
  id: z.number(),
  description: z.string(),
  date: z.string(),
  end_date: z.string().nullable(),
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
  volume: z.number(),
  unit: z.union([z.number(), z.any()]),
  assignor: z.union([z.number(), z.any()]),
  is_done: z.boolean(),
  created_at: z.string().optional(),
  updated_at: z.string().nullable().optional(),
  user_id: z.string(),
  link_bukti_dukung: z.string().nullable(),
})

export type Activity = z.infer<typeof activitySchema>

export type CreateActivityInput = {
  description: string
  date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  volume: number
  unit: number
  assignor: number
  is_done: boolean
  user_id: string
  link_bukti_dukung: string | null
}

export type UpdateActivityInput = Partial<CreateActivityInput>

export const taskSchema = activitySchema
export type Task = Activity
export type CreateTaskInput = CreateActivityInput
export type UpdateTaskInput = UpdateActivityInput
