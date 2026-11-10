import { redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'

/**
 * beforeLoad guard: sends the user home when none of `roleIds` is assigned.
 * A failed role lookup counts as "not allowed", so the page fails closed.
 */
export async function requireAnyRole(roleIds: number[]): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // No session: the authenticated layout takes care of redirecting to sign-in.
  if (!session) return

  const { data: roles, error } = await supabase
    .from('users_roles')
    .select('role_id')
    .eq('user_id', session.user.id)

  const isAllowed =
    !error && roles?.some((role) => roleIds.includes(role.role_id))

  if (!isAllowed) {
    throw redirect({ to: '/', replace: true })
  }
}
