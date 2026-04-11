import { createFileRoute, redirect } from '@tanstack/react-router'
import { Teams } from '@/features/teams'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_authenticated/teams/')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: roles } = await supabase
      .from('users_roles')
      .select('role_id')
      .eq('user_id', session.user.id)
    
    const isAuthorized = roles?.some(r => r.role_id === 1 || r.role_id === 2)
    if (!isAuthorized) {
      throw redirect({ to: '/', replace: true })
    }
  },
  component: Teams,
})
