import z from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Users } from '@/features/users'
import { supabase } from '@/lib/supabase'

const usersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
})

export const Route = createFileRoute('/_authenticated/users/')({
  validateSearch: usersSearchSchema,
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: roles } = await supabase
      .from('users_roles')
      .select('role_id')
      .eq('user_id', session.user.id)
    
    const isAuthorized = roles?.some(r => r.role_id === 1)
    if (!isAuthorized) {
      throw redirect({ to: '/', replace: true })
    }
  },
  component: Users,
})
