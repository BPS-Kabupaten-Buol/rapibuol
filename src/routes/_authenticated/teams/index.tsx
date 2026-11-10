import { createFileRoute } from '@tanstack/react-router'
import { Teams } from '@/features/teams'
import { TEAM_MANAGEMENT_ROLES } from '@/lib/roles'
import { requireAnyRole } from '@/lib/route-guards'

export const Route = createFileRoute('/_authenticated/teams/')({
  beforeLoad: () => requireAnyRole(TEAM_MANAGEMENT_ROLES),
  component: Teams,
})
