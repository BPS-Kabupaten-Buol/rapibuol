import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Activities } from '@/features/activities'

const activitySearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
  is_done: z.array(z.string()).optional().catch([]),
  assignor: z.array(z.string()).optional().catch([]),
  startDate: z.string().optional().catch(''),
  endDate: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/activities/')({
  validateSearch: activitySearchSchema,
  component: Activities,
})
