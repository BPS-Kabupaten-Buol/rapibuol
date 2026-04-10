import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  TeamWithLeader,
  UserTeamWithUser,
  CreateTeamForm,
  UpdateTeamForm,
  AddUserToTeamForm,
} from '../data/schema'

type ProfileJoin = { name: string | null; email: string | null } | null

export function useTeams() {
  const [teams, setTeams] = useState<TeamWithLeader[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeams = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(
          'id, name, leader, created_at, profiles!teams_leader_fkey(id, name, email)'
        )
        .order('name', { ascending: true })

      if (teamsError) throw teamsError

      const { data: membersData, error: membersError } = await supabase
        .from('users_teams')
        .select('team_id')

      if (membersError) throw membersError

      const memberCounts = (membersData || []).reduce(
        (acc, member) => {
          acc[member.team_id] = (acc[member.team_id] || 0) + 1
          return acc
        },
        {} as Record<number, number>
      )

      const mappedTeams: TeamWithLeader[] = (teamsData || []).map((team) => {
        const profile = team.profiles as unknown as ProfileJoin
        return {
          id: team.id,
          name: team.name,
          leader: team.leader,
          leader_name: profile?.name ?? null,
          leader_email: profile?.email ?? null,
          member_count: memberCounts[team.id] || 0,
          created_at: new Date(team.created_at),
        }
      })

      setTeams(mappedTeams)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch teams'
      setError(message)
      // eslint-disable-next-line no-console
      console.error('Fetch teams error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const createTeam = async (formData: CreateTeamForm) => {
    const tempId = -Date.now()
    const tempTeam: TeamWithLeader = {
      id: tempId,
      name: formData.name,
      leader: formData.leader,
      leader_name: null,
      leader_email: null,
      member_count: 0,
      created_at: new Date(),
    }

    // Optimistic: append immediately
    setTeams((prev) => [...prev, tempTeam])

    try {
      const { data, error: createError } = await supabase
        .from('teams')
        .insert({ name: formData.name, leader: formData.leader })
        .select(
          'id, name, leader, created_at, profiles!teams_leader_fkey(id, name, email)'
        )
        .single()

      if (createError) throw createError

      const profile = data.profiles as unknown as ProfileJoin
      const realTeam: TeamWithLeader = {
        id: data.id,
        name: data.name,
        leader: data.leader,
        leader_name: profile?.name ?? null,
        leader_email: profile?.email ?? null,
        member_count: 0,
        created_at: new Date(data.created_at),
      }

      // Replace temp with real server data
      setTeams((prev) => prev.map((t) => (t.id === tempId ? realTeam : t)))
      return data
    } catch (err) {
      // Rollback
      setTeams((prev) => prev.filter((t) => t.id !== tempId))
      const message =
        err instanceof Error ? err.message : 'Failed to create team'
      // eslint-disable-next-line no-console
      console.error('Create team error:', err)
      throw new Error(message)
    }
  }

  const updateTeam = async (id: number, formData: UpdateTeamForm) => {
    const previousTeams = teams

    // Optimistic: update name + leader immediately
    setTeams((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, name: formData.name, leader: formData.leader } : t
      )
    )

    try {
      const { data, error: updateError } = await supabase
        .from('teams')
        .update({ name: formData.name, leader: formData.leader })
        .eq('id', id)
        .select(
          'id, name, leader, created_at, profiles!teams_leader_fkey(id, name, email)'
        )
        .single()

      if (updateError) throw updateError

      const profile = data.profiles as unknown as ProfileJoin

      // Update with real leader info from server
      setTeams((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                name: data.name,
                leader: data.leader,
                leader_name: profile?.name ?? null,
                leader_email: profile?.email ?? null,
              }
            : t
        )
      )
      return data
    } catch (err) {
      // Rollback
      setTeams(previousTeams)
      const message =
        err instanceof Error ? err.message : 'Failed to update team'
      // eslint-disable-next-line no-console
      console.error('Update team error:', err)
      throw new Error(message)
    }
  }

  const deleteTeam = async (id: number) => {
    const previousTeams = teams

    // Optimistic: remove immediately
    setTeams((prev) => prev.filter((t) => t.id !== id))

    try {
      const { error: deleteMembersError } = await supabase
        .from('users_teams')
        .delete()
        .eq('team_id', id)

      if (deleteMembersError) throw deleteMembersError

      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
    } catch (err) {
      // Rollback
      setTeams(previousTeams)
      const message =
        err instanceof Error ? err.message : 'Failed to delete team'
      // eslint-disable-next-line no-console
      console.error('Delete team error:', err)
      throw new Error(message)
    }
  }

  const deleteTeams = async (ids: number[]) => {
    const previousTeams = teams

    // Optimistic: remove all immediately
    setTeams((prev) => prev.filter((t) => !ids.includes(t.id)))

    try {
      const { error: deleteMembersError } = await supabase
        .from('users_teams')
        .delete()
        .in('team_id', ids)

      if (deleteMembersError) throw deleteMembersError

      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .in('id', ids)

      if (deleteError) throw deleteError
    } catch (err) {
      // Rollback
      setTeams(previousTeams)
      const message =
        err instanceof Error ? err.message : 'Failed to delete teams'
      // eslint-disable-next-line no-console
      console.error('Delete teams error:', err)
      throw new Error(message)
    }
  }

  return {
    teams,
    isLoading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    deleteTeams,
    refetch: fetchTeams,
  }
}

export function useTeamMembers(teamId: number) {
  const [members, setMembers] = useState<UserTeamWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('users_teams')
        .select(
          'id, user_id, team_id, created_at, profiles!users_teams_user_id_fkey(id, name, email)'
        )
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const mappedMembers: UserTeamWithUser[] = (data || []).map((member) => {
        const profile = member.profiles as unknown as ProfileJoin
        return {
          id: member.id,
          user_id: member.user_id,
          team_id: member.team_id,
          user_name: profile?.name ?? 'Unknown',
          user_email: profile?.email ?? '',
          created_at: new Date(member.created_at),
        }
      })

      setMembers(mappedMembers)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch team members'
      setError(message)
      // eslint-disable-next-line no-console
      console.error('Fetch team members error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const addMember = async (formData: AddUserToTeamForm) => {
    try {
      const { data: existingMember, error: checkError } = await supabase
        .from('users_teams')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', formData.user_id)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') throw checkError
      if (existingMember)
        throw new Error('User is already a member of this team')

      const { error: addError } = await supabase.from('users_teams').insert({
        user_id: formData.user_id,
        team_id: teamId,
      })

      if (addError) throw addError
      await fetchMembers()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add member'
      // eslint-disable-next-line no-console
      console.error('Add team member error:', err)
      throw new Error(message)
    }
  }

  const removeMember = async (memberId: number) => {
    const previousMembers = members

    // Optimistic: remove immediately
    setMembers((prev) => prev.filter((m) => m.id !== memberId))

    try {
      const { error: deleteError } = await supabase
        .from('users_teams')
        .delete()
        .eq('id', memberId)

      if (deleteError) throw deleteError
    } catch (err) {
      // Rollback
      setMembers(previousMembers)
      const message =
        err instanceof Error ? err.message : 'Failed to remove member'
      // eslint-disable-next-line no-console
      console.error('Remove team member error:', err)
      throw new Error(message)
    }
  }

  const removeMembers = async (memberIds: number[]) => {
    const previousMembers = members

    // Optimistic: remove all immediately
    setMembers((prev) => prev.filter((m) => !memberIds.includes(m.id)))

    try {
      const { error: deleteError } = await supabase
        .from('users_teams')
        .delete()
        .in('id', memberIds)

      if (deleteError) throw deleteError
    } catch (err) {
      // Rollback
      setMembers(previousMembers)
      const message =
        err instanceof Error ? err.message : 'Failed to remove members'
      // eslint-disable-next-line no-console
      console.error('Remove team members error:', err)
      throw new Error(message)
    }
  }

  return {
    members,
    isLoading,
    error,
    addMember,
    removeMember,
    removeMembers,
    refetch: fetchMembers,
  }
}
