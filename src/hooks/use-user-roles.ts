import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/auth-provider'
import { supabase } from '@/lib/supabase'

/**
 * Returns the role IDs assigned to the current user.
 * role 1 = admin, role 2 = kepala
 */
export function useUserRoles() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [] as number[]
      const { data } = await supabase
        .from('users_roles')
        .select('role_id')
        .eq('user_id', userId)
      return (data?.map((r) => r.role_id) ?? []) as number[]
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
