import { z } from 'zod'

export const teamSchema = z.object({
  id: z.number(),
  name: z.string(),
  leader: z.string().nullable(),
  createdAt: z.coerce.date(),
})
export type Team = z.infer<typeof teamSchema>

export const addTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  leader: z.string().optional().nullable(),
})
export type AddTeamForm = z.infer<typeof addTeamSchema>
