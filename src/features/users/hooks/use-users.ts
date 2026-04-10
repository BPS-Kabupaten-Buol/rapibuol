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
          teams (
            id,
            name
          )
        `)

      const { data: usersRolesData } = await supabase.from('users_roles')
        .select(`
          user_id,
          roles (
            id,
            name
          )
        `)

      const mappedUsers: User[] = (profilesData || []).map((profile) => {
        const userTeams = (usersTeamsData || [])
          .filter((ut: any) => ut.user_id === profile.id)
          .map((ut: any) => ut.teams as any)
          .filter(Boolean)

        const userRole = (usersRolesData || []).find(
          (ur: any) => ur.user_id === profile.id
        )?.roles as any

        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          teams: (userTeams || []) as User['teams'],
          role: (userRole || null) as User['role'],
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

    if (formData.roleId) {
      await supabase.from('users_roles').insert({
        user_id: authUserId,
        role_id: formData.roleId,
      })
    }

    await fetchUsers()
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

    await fetchUsers()
  }

  const deleteUsers = async (userIds: string[]) => {
    for (const userId of userIds) {
      await supabase.from('profiles').delete().eq('id', userId)
      await supabase.auth.admin.deleteUser(userId)
    }
    await fetchUsers()
  }

  return {
    users,
    isLoading,
    error,
    addUser,
    deleteUser,
    deleteUsers,
    refetch: fetchUsers,
  }
}
