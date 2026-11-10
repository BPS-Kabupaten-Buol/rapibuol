import { useQuery } from '@tanstack/react-query'
import { getErrorMessage } from '@/lib/handle-server-error'
import { supabase } from '@/lib/supabase'
import type { Role } from '../data/schema'

type RoleRow = {
  id: number
  name: string
  description: string | null
  created_at: string
}

async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('id, name, description, created_at')
    .order('name')

  if (error) throw error

  return (data as RoleRow[]).map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    createdAt: new Date(role.created_at),
  }))
}

export function useRoles() {
  const query = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  })

  return {
    roles: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
  }
}
