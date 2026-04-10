import { z } from 'zod'

// Database schema - teams table
export const teamSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Team name is required'),
  leader: z.string().uuid(),
  created_at: z.coerce.date(),
})

export type Team = z.infer<typeof teamSchema>

// Team with leader details
export const teamWithLeaderSchema = z.object({
  id: z.number(),
  name: z.string(),
  leader: z.string().uuid(),
  leader_name: z.string().nullable(),
  leader_email: z.string().email().nullable(),
  member_count: z.number().default(0),
  created_at: z.coerce.date(),
})

export type TeamWithLeader = z.infer<typeof teamWithLeaderSchema>

// Database schema - users_teams table
export const userTeamSchema = z.object({
  id: z.number(),
  user_id: z.string().uuid(),
  team_id: z.number(),
  created_at: z.coerce.date(),
})

export type UserTeam = z.infer<typeof userTeamSchema>

// User team with user details
export const userTeamWithUserSchema = z.object({
  id: z.number(),
  user_id: z.string().uuid(),
  team_id: z.number(),
  user_name: z.string(),
  user_email: z.string().email(),
  created_at: z.coerce.date(),
})

export type UserTeamWithUser = z.infer<typeof userTeamWithUserSchema>

// Form schema for creating teams
export const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name must be less than 100 characters'),
  leader: z.string().uuid('Please select a valid team leader'),
})

export type CreateTeamForm = z.infer<typeof createTeamSchema>

// Form schema for updating teams
export const updateTeamSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name must be less than 100 characters'),
  leader: z.string().uuid('Please select a valid team leader'),
})

export type UpdateTeamForm = z.infer<typeof updateTeamSchema>

// Form schema for adding user to team
export const addUserToTeamSchema = z.object({
  user_id: z.string().uuid('Please select a valid user'),
})

export type AddUserToTeamForm = z.infer<typeof addUserToTeamSchema>
