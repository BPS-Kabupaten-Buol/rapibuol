import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '@/lib/handle-server-error'
import { supabase } from '@/lib/supabase'
import type { User, AddUserForm } from '../data/schema'

type ProfileRow = {
  id: string
  name: string
  email: string
  created_at: string
}

type JoinedTeam = { id: number; name: string }
type JoinedRole = { id: number; name: string }

const usersKey = ['users'] as const

async function fetchUsers(): Promise<User[]> {
  const [profilesRes, teamsRes, rolesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('users_teams').select('user_id, teams(id, name)'),
    supabase.from('users_roles').select('user_id, roles(id, name)'),
  ])

  if (profilesRes.error) throw profilesRes.error
  if (teamsRes.error) throw teamsRes.error
  if (rolesRes.error) throw rolesRes.error

  const teamsByUser = new Map<string, JoinedTeam[]>()
  for (const row of teamsRes.data ?? []) {
    const team = row.teams as unknown as JoinedTeam | null
    if (!team) continue
    teamsByUser.set(row.user_id, [...(teamsByUser.get(row.user_id) ?? []), team])
  }

  const rolesByUser = new Map<string, JoinedRole[]>()
  for (const row of rolesRes.data ?? []) {
    const role = row.roles as unknown as JoinedRole | null
    if (!role) continue
    rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), role])
  }

  return (profilesRes.data as ProfileRow[]).map((profile) => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    teams: teamsByUser.get(profile.id) ?? [],
    roles: rolesByUser.get(profile.id) ?? [],
    createdAt: new Date(profile.created_at),
  }))
}

export function useUsers() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: usersKey,
    queryFn: fetchUsers,
  })

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: usersKey })

  const addUser = async (formData: AddUserForm) => {
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
      })

    if (authError) throw authError

    const authUserId = authData.user?.id
    if (!authUserId) throw new Error('Failed to create auth user')

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUserId,
        email: formData.email,
        name: formData.fullName,
      })
      .select()
      .single()

    if (profileError) throw profileError

    if (formData.teamIds && formData.teamIds.length > 0) {
      const { error: teamsError } = await supabase.from('users_teams').insert(
        formData.teamIds.map((teamId) => ({
          user_id: authUserId,
          team_id: teamId,
        }))
      )
      if (teamsError) throw teamsError
    }

    if (formData.roleIds && formData.roleIds.length > 0) {
      const { error: rolesError } = await supabase.from('users_roles').insert(
        formData.roleIds.map((roleId) => ({
          user_id: authUserId,
          role_id: roleId,
        }))
      )
      if (rolesError) throw rolesError
    }

    await invalidateUsers()
    return profileData
  }

  const deleteUser = async (userId: string) => {
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (deleteProfileError) throw deleteProfileError

    const { error: deleteAuthError } =
      await supabase.auth.admin.deleteUser(userId)
    if (deleteAuthError) throw deleteAuthError

    await invalidateUsers()
  }

  const deleteUsers = async (userIds: string[]) => {
    for (const userId of userIds) {
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (deleteProfileError) throw deleteProfileError

      const { error: deleteAuthError } =
        await supabase.auth.admin.deleteUser(userId)
      if (deleteAuthError) throw deleteAuthError
    }

    await invalidateUsers()
  }

  const updateUserRole = async (userId: string, roleIds: number[]) => {
    const { error: deleteError } = await supabase
      .from('users_roles')
      .delete()
      .eq('user_id', userId)

    if (deleteError && deleteError.code !== 'PGRST116') throw deleteError

    if (roleIds.length > 0) {
      const { error: insertError } = await supabase
        .from('users_roles')
        .insert(
          roleIds.map((roleId) => ({ user_id: userId, role_id: roleId }))
        )

      if (insertError) throw insertError
    }

    await invalidateUsers()
  }

  const updateUserTeams = async (userId: string, teamIds: number[]) => {
    const { error: deleteError } = await supabase
      .from('users_teams')
      .delete()
      .eq('user_id', userId)

    if (deleteError && deleteError.code !== 'PGRST116') throw deleteError

    if (teamIds.length > 0) {
      const { error: insertError } = await supabase
        .from('users_teams')
        .insert(
          teamIds.map((teamId) => ({ user_id: userId, team_id: teamId }))
        )

      if (insertError) throw insertError
    }

    await invalidateUsers()
  }

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
    addUser,
    deleteUser,
    deleteUsers,
    updateUserRole,
    updateUserTeams,
    fetchUsers: async () => {
      await invalidateUsers()
    },
  }
}
