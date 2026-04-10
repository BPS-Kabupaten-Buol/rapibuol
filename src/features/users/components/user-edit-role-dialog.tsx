'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  editUserRoleSchema,
  type EditUserRoleForm,
  type User,
} from '../data/schema'
import { useRoles, useTeams, useUsers } from '../hooks'
import { useUsersDialog } from './users-provider'

type UserEditRoleDialogProps = {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserEditRoleDialog({
  user,
  open,
  onOpenChange,
}: UserEditRoleDialogProps) {
  const { roles } = useRoles()
  const { teams } = useTeams()
  const { updateUserRole, updateUserTeams } = useUsers()
  const { fetchUsers } = useUsersDialog()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTeams, setSelectedTeams] = useState<number[]>([])
  const [selectedRoles, setSelectedRoles] = useState<number[]>([])
  const [isAddingTeam, setIsAddingTeam] = useState(false)
  const [isAddingRole, setIsAddingRole] = useState(false)

  const form = useForm<EditUserRoleForm>({
    resolver: zodResolver(editUserRoleSchema),
    defaultValues: {
      roleIds: undefined,
      teamIds: undefined,
    },
  })

  useEffect(() => {
    if (open && user) {
      const currentTeamIds = user.teams?.map((t) => t.id) || []
      const currentRoleIds = user.roles?.map((r) => r.id) || []

      setSelectedTeams(currentTeamIds)
      setSelectedRoles(currentRoleIds)
      form.reset({
        roleIds: currentRoleIds,
        teamIds: currentTeamIds,
      })
    }
  }, [open, user, form])

  const availableTeams = teams.filter(
    (team) => !selectedTeams.includes(team.id)
  )

  const availableRoles = roles.filter(
    (role) => !selectedRoles.includes(role.id)
  )

  const handleAddTeam = (teamId: number) => {
    const newTeams = [...selectedTeams, teamId]
    setSelectedTeams(newTeams)
    form.setValue('teamIds', newTeams)
    setIsAddingTeam(false)
  }

  const handleRemoveTeam = (teamId: number) => {
    const newTeams = selectedTeams.filter((id) => id !== teamId)
    setSelectedTeams(newTeams)
    form.setValue('teamIds', newTeams)
  }

  const handleAddRole = (roleId: number) => {
    const newRoles = [...selectedRoles, roleId]
    setSelectedRoles(newRoles)
    form.setValue('roleIds', newRoles)
    setIsAddingRole(false)
  }

  const handleRemoveRole = (roleId: number) => {
    const newRoles = selectedRoles.filter((id) => id !== roleId)
    setSelectedRoles(newRoles)
    form.setValue('roleIds', newRoles)
  }

  const onSubmit = async (data: EditUserRoleForm) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      // Update roles
      const roleIds = data.roleIds || []
      await updateUserRole(user.id, roleIds)

      // Update teams
      const teamIds = data.teamIds || []
      await updateUserTeams(user.id, teamIds)

      toast.success('User roles and teams updated successfully!')

      // Refetch users to auto-refresh table
      await fetchUsers()

      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update user'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Manage User Roles & Teams</DialogTitle>
          <DialogDescription>
            Edit roles and team membership for {user.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Roles Section */}
            <div className='space-y-3'>
              <h3 className='text-sm font-semibold'>Roles</h3>

              {/* Add Role Form */}
              {!isAddingRole ? (
                <Button
                  type='button'
                  onClick={() => setIsAddingRole(true)}
                  variant='outline'
                  size='sm'
                  className='w-full'
                  disabled={availableRoles.length === 0}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add Role
                </Button>
              ) : (
                <div className='rounded-lg border p-3'>
                  <div className='mb-3 flex items-center justify-between'>
                    <h4 className='text-sm font-medium'>Add Role</h4>
                    <button
                      type='button'
                      onClick={() => setIsAddingRole(false)}
                      className='text-muted-foreground hover:text-foreground'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>

                  <Select
                    onValueChange={(roleId) => handleAddRole(parseInt(roleId))}
                  >
                    <SelectTrigger className='mb-2'>
                      <SelectValue placeholder='Select a role' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.length === 0 ? (
                        <SelectItem value='__no-roles__' disabled>
                          All roles assigned
                        </SelectItem>
                      ) : (
                        availableRoles.map((role) => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {role.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='flex-1'
                      onClick={() => setIsAddingRole(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Roles List */}
              {selectedRoles.length > 0 ? (
                <div className='space-y-2'>
                  {selectedRoles.map((roleId) => {
                    const role = roles.find((r) => r.id === roleId)
                    return (
                      <div
                        key={roleId}
                        className='flex items-center justify-between rounded-lg border p-2'
                      >
                        <span className='text-sm font-medium'>
                          {role?.name}
                        </span>
                        <button
                          type='button'
                          onClick={() => handleRemoveRole(roleId)}
                          className='text-red-600 hover:text-red-700'
                          title='Remove role'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className='rounded-lg border border-dashed p-4 text-center'>
                  <p className='text-sm text-muted-foreground'>
                    No roles assigned yet
                  </p>
                </div>
              )}
            </div>

            {/* Teams Section */}
            <div className='space-y-3'>
              <h3 className='text-sm font-semibold'>Teams</h3>

              {/* Add Team Form */}
              {!isAddingTeam ? (
                <Button
                  type='button'
                  onClick={() => setIsAddingTeam(true)}
                  variant='outline'
                  size='sm'
                  className='w-full'
                  disabled={availableTeams.length === 0}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add Team
                </Button>
              ) : (
                <div className='rounded-lg border p-3'>
                  <div className='mb-3 flex items-center justify-between'>
                    <h4 className='text-sm font-medium'>Add Team</h4>
                    <button
                      type='button'
                      onClick={() => setIsAddingTeam(false)}
                      className='text-muted-foreground hover:text-foreground'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>

                  <Select
                    onValueChange={(teamId) => handleAddTeam(parseInt(teamId))}
                  >
                    <SelectTrigger className='mb-2'>
                      <SelectValue placeholder='Select a team' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeams.length === 0 ? (
                        <SelectItem value='__no-teams__' disabled>
                          All teams assigned
                        </SelectItem>
                      ) : (
                        availableTeams.map((team) => (
                          <SelectItem key={team.id} value={String(team.id)}>
                            {team.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='flex-1'
                      onClick={() => setIsAddingTeam(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Teams List */}
              {selectedTeams.length > 0 ? (
                <div className='space-y-2'>
                  {selectedTeams.map((teamId) => {
                    const team = teams.find((t) => t.id === teamId)
                    return (
                      <div
                        key={teamId}
                        className='flex items-center justify-between rounded-lg border p-2'
                      >
                        <span className='text-sm font-medium'>
                          {team?.name}
                        </span>
                        <button
                          type='button'
                          onClick={() => handleRemoveTeam(teamId)}
                          className='text-red-600 hover:text-red-700'
                          title='Remove team'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className='rounded-lg border border-dashed p-4 text-center'>
                  <p className='text-sm text-muted-foreground'>
                    No teams assigned yet
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className='flex gap-2 pt-4'>
              <Button
                type='button'
                variant='outline'
                className='flex-1'
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit' className='flex-1' disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
