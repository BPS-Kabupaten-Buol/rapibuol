import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, AddUserForm } from '../data/schema'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      const { data: usersTeamsData } = await supabase.from('users_teams')
        .select(`
        user_id,
        teams ( id, name )
      `)

      const { data: usersRolesData } = await supabase.from('users_roles')
        .select(`
        user_id,
        roles ( id, name )
      `)

      const mappedUsers: User[] = (profilesData || []).map((profile) => {
        const userTeams = (usersTeamsData || [])
          .filter((ut: any) => ut.user_id === profile.id)
          .map((ut: any) => ut.teams as any)
          .filter(Boolean)

        const userRoles = (usersRolesData || [])
          .filter((ur: any) => ur.user_id === profile.id)
          .map((ur: any) => ur.roles as any)
          .filter(Boolean)

        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          teams: (userTeams || []) as User['teams'],
          roles: (userRoles || []) as User['roles'],
          createdAt: new Date(profile.created_at),
        }
      })

      setUsers(mappedUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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
      await supabase.from('users_teams').insert(
        formData.teamIds.map((teamId) => ({
          user_id: authUserId,
          team_id: teamId,
        }))
      )
    }

    if (formData.roleIds && formData.roleIds.length > 0) {
      await supabase.from('users_roles').insert(
        formData.roleIds.map((roleId) => ({
          user_id: authUserId,
          role_id: roleId,
        }))
      )
    }

    // addUser always refetches — needs authoritative server data
    await fetchUsers()
    return profileData
  }

  const deleteUser = async (userId: string) => {
    const previousUsers = users

    // Optimistic: remove immediately
    setUsers((prev) => prev.filter((u) => u.id !== userId))

    try {
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (deleteProfileError) throw deleteProfileError

      const { error: deleteAuthError } =
        await supabase.auth.admin.deleteUser(userId)
      if (deleteAuthError) throw deleteAuthError
    } catch (err) {
      // Rollback
      setUsers(previousUsers)
      throw err
    }
  }

  const deleteUsers = async (userIds: string[]) => {
    const previousUsers = users

    // Optimistic: remove all immediately
    setUsers((prev) => prev.filter((u) => !userIds.includes(u.id)))

    try {
      for (const userId of userIds) {
        await supabase.from('profiles').delete().eq('id', userId)
        await supabase.auth.admin.deleteUser(userId)
      }
    } catch (err) {
      // Rollback
      setUsers(previousUsers)
      throw err
    }
  }

  const updateUserRole = async (userId: string, roleIds: number[]) => {
    const previousUsers = users

    // Build lookup from current state
    const roleMap = new Map<number, { id: number; name: string }>()
    users.forEach((u) => u.roles.forEach((r) => roleMap.set(r.id, r)))

    const optimisticRoles = roleIds
      .map((id) => roleMap.get(id))
      .filter((r): r is { id: number; name: string } => r !== undefined)

    // Optimistic: update roles immediately
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, roles: optimisticRoles } : u))
    )

    try {
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

      // Refetch for accurate join data
      await fetchUsers()
    } catch (err) {
      // Rollback
      setUsers(previousUsers)
      throw err
    }
  }

  const updateUserTeams = async (userId: string, teamIds: number[]) => {
    const previousUsers = users

    // Build lookup from current state
    const teamMap = new Map<number, { id: number; name: string }>()
    users.forEach((u) => u.teams.forEach((t) => teamMap.set(t.id, t)))

    const optimisticTeams = teamIds
      .map((id) => teamMap.get(id))
      .filter((t): t is { id: number; name: string } => t !== undefined)

    // Optimistic: update teams immediately
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, teams: optimisticTeams } : u))
    )

    try {
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

      // Refetch for accurate join data
      await fetchUsers()
    } catch (err) {
      // Rollback
      setUsers(previousUsers)
      throw err
    }
  }

  return {
    users,
    isLoading,
    error,
    addUser,
    deleteUser,
    deleteUsers,
    updateUserRole,
    updateUserTeams,
    fetchUsers,
  }
}
