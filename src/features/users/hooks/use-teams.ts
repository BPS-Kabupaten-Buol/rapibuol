import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Team } from '../data/schema'

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTeams() {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('name')

        if (error) throw error
        setTeams(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch teams')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeams()
  }, [])

  return { teams, isLoading, error }
}
