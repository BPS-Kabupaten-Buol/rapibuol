import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Team } from '../data/schema'

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeams = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('teams')
        .select(
          `
          id,
          name,
          leader,
          profiles!teams_leader_fkey(id, name, email),
          created_at
        `
        )
        .order('name', { ascending: true })

      if (error) throw error

      const mappedTeams: Team[] = (data || []).map((team) => ({
        id: team.id,
        name: team.name,
        leader: team.profiles?.id || null, // Extract UUID from profile
        createdAt: new Date(team.created_at),
      }))

      setTeams(mappedTeams)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const createTeam = async (teamData: Omit<Team, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('teams')
      .insert({
        name: teamData.name,
        leader: teamData.leader,
      })
      .select()
      .single()

    if (error) throw error
    await fetchTeams()
    return data
  }

  const updateTeam = async (id: number, teamData: Partial<Team>) => {
    const { data, error } = await supabase
      .from('teams')
      .update({
        name: teamData.name,
        leader: teamData.leader,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    await fetchTeams()
    return data
  }

  const deleteTeam = async (id: number) => {
    const { error } = await supabase.from('teams').delete().eq('id', id)

    if (error) throw error
    await fetchTeams()
  }

  return {
    teams,
    isLoading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    refetch: fetchTeams,
  }
}
