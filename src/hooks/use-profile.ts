import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return data
    },
    enabled: !!userId,
  })
}
