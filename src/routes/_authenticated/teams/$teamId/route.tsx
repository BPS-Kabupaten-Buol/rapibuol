import { createFileRoute } from '@tanstack/react-router'
import { TeamDetail } from '@/features/teams/team-detail'

export const Route = createFileRoute('/_authenticated/teams/$teamId')({
  component: TeamDetail,
})
