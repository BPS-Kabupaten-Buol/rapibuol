import { z } from 'zod'

export const taskSchema = z.object({
  id: z.number(),
  description: z.string(),
  date: z.string(),
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
  volume: z.number(),
  unit: z.number(),
  assignor: z.number(),
  is_done: z.boolean(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  user_id: z.string(),
})

export type Task = z.infer<typeof taskSchema>

export type CreateTaskInput = {
  description: string
  date: string
  start_time: string | null
  end_time: string | null
  volume: number
  unit: number
  assignor: number
  is_done: boolean
  user_id: string
}

export type UpdateTaskInput = Partial<CreateTaskInput>
