import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Users } from '@/features/users'
import { USER_MANAGEMENT_ROLES } from '@/lib/roles'
import { requireAnyRole } from '@/lib/route-guards'

const usersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
})

export const Route = createFileRoute('/_authenticated/users/')({
  validateSearch: usersSearchSchema,
  beforeLoad: () => requireAnyRole(USER_MANAGEMENT_ROLES),
  component: Users,
})
