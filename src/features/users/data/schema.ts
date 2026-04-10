import { z } from 'zod'

export const _userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  teams: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
    })
  ),
  roles: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
    })
  ),
  createdAt: z.coerce.date(),
})
export type User = z.infer<typeof _userSchema>

export const teamSchema = z.object({
  id: z.number(),
  name: z.string(),
  leader: z.string().nullable(),
  createdAt: z.coerce.date(),
})
export type Team = z.infer<typeof teamSchema>

// Schema for editing user roles and teams
export const editUserRoleSchema = z.object({
  roleIds: z.array(z.number()).optional(),
  teamIds: z.array(z.number()).optional(),
})
export type EditUserRoleForm = z.infer<typeof editUserRoleSchema>

export const roleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
})
export type Role = z.infer<typeof roleSchema>

export const addUserSchema = z
  .object({
    email: z.string().email('Please enter a valid email'),
    fullName: z.string().min(1, 'Display name is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    teamIds: z.array(z.number()).optional(),
    roleIds: z.array(z.number()).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type AddUserForm = z.infer<typeof addUserSchema>
