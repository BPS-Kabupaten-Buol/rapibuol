import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Role } from '../data/schema'

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRoles() {
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('*')
          .order('name')

        if (error) throw error
        setRoles(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch roles')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoles()
  }, [])

  return { roles, isLoading, error }
}
