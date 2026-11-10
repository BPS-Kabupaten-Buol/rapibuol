import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '@/lib/handle-server-error'
import { supabase } from '@/lib/supabase'
import type {
  TeamWithLeader,
  UserTeamWithUser,
  CreateTeamForm,
  UpdateTeamForm,
  AddUserToTeamForm,
} from '../data/schema'

type ProfileJoin = { name: string | null; email: string | null } | null

type TeamRow = {
  id: number
  name: string
  leader: string
  created_at: string
  profiles: ProfileJoin
  users_teams: { count: number }[] | null
}

type MemberRow = {
  id: number
  user_id: string
  team_id: number
  created_at: string
  profiles: ProfileJoin
}

const TEAM_SELECT =
  'id, name, leader, created_at, profiles!teams_leader_fkey(id, name, email), users_teams(count)'

const MEMBER_SELECT =
  'id, user_id, team_id, created_at, profiles!users_teams_user_id_fkey(id, name, email)'

const teamsKey = ['teams', 'management'] as const

const teamMembersKey = (teamId: number) => ['team-members', teamId] as const

function mapTeam(team: TeamRow): TeamWithLeader {
  return {
    id: team.id,
    name: team.name,
    leader: team.leader,
    leader_name: team.profiles?.name ?? null,
    leader_email: team.profiles?.email ?? null,
    member_count: team.users_teams?.[0]?.count ?? 0,
    created_at: new Date(team.created_at),
  }
}

function mapMember(member: MemberRow): UserTeamWithUser {
  return {
    id: member.id,
    user_id: member.user_id,
    team_id: member.team_id,
    user_name: member.profiles?.name ?? 'Unknown',
    user_email: member.profiles?.email ?? '',
    created_at: new Date(member.created_at),
  }
}

async function fetchTeams(): Promise<TeamWithLeader[]> {
  const { data, error } = await supabase
    .from('teams')
    .select(TEAM_SELECT)
    .order('name', { ascending: true })

  if (error) throw error
  return (data as unknown as TeamRow[]).map(mapTeam)
}

/**
 * Deletes teams together with their memberships.
 * The memberships are kept in memory so a failed team delete can restore them,
 * because supabase-js cannot run two statements in one transaction.
 */
async function deleteTeamsWithMembers(ids: number[]): Promise<void> {
  if (ids.length === 0) return

  const { data: memberships, error: membershipsError } = await supabase
    .from('users_teams')
    .select('user_id, team_id')
    .in('team_id', ids)

  if (membershipsError) throw membershipsError

  const { error: membersError } = await supabase
    .from('users_teams')
    .delete()
    .in('team_id', ids)

  if (membersError) throw membersError

  const { error: teamsError } = await supabase
    .from('teams')
    .delete()
    .in('id', ids)

  if (teamsError) {
    if (memberships && memberships.length > 0) {
      await supabase.from('users_teams').insert(memberships)
    }
    throw teamsError
  }
}

export function useTeams() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: teamsKey,
    queryFn: fetchTeams,
  })

  const invalidateTeams = () =>
    queryClient.invalidateQueries({ queryKey: ['teams'] })

  const createTeam = async (formData: CreateTeamForm) => {
    const { data, error } = await supabase
      .from('teams')
      .insert({ name: formData.name, leader: formData.leader })
      .select(TEAM_SELECT)
      .single()

    if (error) throw error

    await invalidateTeams()
    return mapTeam(data as unknown as TeamRow)
  }

  const updateTeam = async (id: number, formData: UpdateTeamForm) => {
    const { data, error } = await supabase
      .from('teams')
      .update({ name: formData.name, leader: formData.leader })
      .eq('id', id)
      .select(TEAM_SELECT)
      .single()

    if (error) throw error

    await invalidateTeams()
    return mapTeam(data as unknown as TeamRow)
  }

  const deleteTeam = async (id: number) => {
    await deleteTeamsWithMembers([id])
    await Promise.all([
      invalidateTeams(),
      queryClient.invalidateQueries({ queryKey: ['users'] }),
    ])
  }

  const deleteTeams = async (ids: number[]) => {
    await deleteTeamsWithMembers(ids)
    await Promise.all([
      invalidateTeams(),
      queryClient.invalidateQueries({ queryKey: ['users'] }),
    ])
  }

  return {
    teams: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
    createTeam,
    updateTeam,
    deleteTeam,
    deleteTeams,
    refetch: async () => {
      await query.refetch()
    },
  }
}

async function fetchTeamMembers(teamId: number): Promise<UserTeamWithUser[]> {
  const { data, error } = await supabase
    .from('users_teams')
    .select(MEMBER_SELECT)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as unknown as MemberRow[]).map(mapMember)
}

export function useTeamMembers(teamId: number) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: teamMembersKey(teamId),
    queryFn: () => fetchTeamMembers(teamId),
    enabled: teamId > 0,
  })

  const invalidateMembers = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: teamMembersKey(teamId) }),
      // member_count lives on the teams list.
      queryClient.invalidateQueries({ queryKey: ['teams'] }),
    ])

  const addMember = async (formData: AddUserToTeamForm) => {
    const { data: existingMember, error: checkError } = await supabase
      .from('users_teams')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', formData.user_id)
      .maybeSingle()

    if (checkError) throw checkError
    if (existingMember) {
      throw new Error('User is already a member of this team')
    }

    const { error } = await supabase.from('users_teams').insert({
      user_id: formData.user_id,
      team_id: teamId,
    })

    if (error) throw error
    await invalidateMembers()
  }

  const addMembers = async (userIds: string[]) => {
    if (userIds.length === 0) return

    const { error } = await supabase
      .from('users_teams')
      .insert(userIds.map((user_id) => ({ user_id, team_id: teamId })))

    if (error) throw error
    await invalidateMembers()
  }

  const removeMember = async (memberId: number) => {
    const { error } = await supabase
      .from('users_teams')
      .delete()
      .eq('id', memberId)

    if (error) throw error
    await invalidateMembers()
  }

  const removeMembers = async (memberIds: number[]) => {
    if (memberIds.length === 0) return

    const { error } = await supabase
      .from('users_teams')
      .delete()
      .in('id', memberIds)

    if (error) throw error
    await invalidateMembers()
  }

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
    addMember,
    addMembers,
    removeMember,
    removeMembers,
    refetch: async () => {
      await query.refetch()
    },
  }
}
