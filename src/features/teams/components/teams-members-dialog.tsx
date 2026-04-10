import { useState } from 'react'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUsers } from '@/features/users/hooks'
import { addUserToTeamSchema, type AddUserToTeamForm } from '../data/schema'
import { useTeamMembers } from '../hooks'
import { useTeamDialog } from './teams-provider'

export function TeamsMembersDialog() {
  const { isMembersOpen, onMembersOpen, selectedTeam } = useTeamDialog()
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AddUserToTeamForm>({
    resolver: zodResolver(addUserToTeamSchema),
    defaultValues: {
      user_id: '',
    },
  })

  const { members, isLoading, addMember, removeMember } = useTeamMembers(
    selectedTeam?.id || 0
  )
  const { users } = useUsers()

  // Filter out users that are already team members
  const availableUsers = users.filter(
    (user) => !members.some((member) => member.user_id === user.id)
  )

  const onSubmit = async (data: AddUserToTeamForm) => {
    setIsSubmitting(true)
    try {
      await addMember(data)
      toast.success('Member added successfully!')
      form.reset()
      setIsAddingMember(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add member'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveMember = async (memberId: number, memberName: string) => {
    try {
      await removeMember(memberId)
      toast.success(`${memberName} removed from team`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove member'
      )
    }
  }

  return (
    <Dialog open={isMembersOpen} onOpenChange={onMembersOpen}>
      <DialogContent className='flex'>
        <DialogHeader>
          <DialogTitle>Team Members</DialogTitle>
          <DialogDescription>
            Manage members for {selectedTeam?.name}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Add Member Form */}
          {!isAddingMember ? (
            <Button
              onClick={() => setIsAddingMember(true)}
              variant='outline'
              size='sm'
              className='w-full'
            >
              <Plus className='mr-2 h-4 w-4' />
              Add Member
            </Button>
          ) : (
            <div className='rounded-lg border p-4'>
              <div className='mb-4 flex items-center justify-between'>
                <h3 className='font-medium'>Add New Member</h3>
                <button
                  onClick={() => setIsAddingMember(false)}
                  className='text-muted-foreground hover:text-foreground'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='mx-3 space-y-3 bg-blue-200'
                >
                  <FormField
                    control={form.control}
                    name='user_id'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select User</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Choose a user' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableUsers.length === 0 ? (
                              <SelectItem value='__no-users__' disabled>
                                All users are already members
                              </SelectItem>
                            ) : (
                              availableUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name} ({user.email})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='flex gap-2 pt-2'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='flex-1'
                      onClick={() => {
                        setIsAddingMember(false)
                        form.reset()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type='submit'
                      size='sm'
                      className='flex-1'
                      disabled={isSubmitting || availableUsers.length === 0}
                    >
                      {isSubmitting ? 'Adding...' : 'Add Member'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Members List */}
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className='w-10 text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className='h-24 text-center'>
                      Loading members...
                    </TableCell>
                  </TableRow>
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='h-24 text-center'>
                      No members in this team yet
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className='font-medium'>
                        {member.user_name}
                      </TableCell>
                      <TableCell className='text-sm text-muted-foreground'>
                        {member.user_email}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {member.created_at.toLocaleDateString()}
                      </TableCell>
                      <TableCell className='text-right'>
                        <button
                          onClick={() =>
                            handleRemoveMember(member.id, member.user_name)
                          }
                          className='text-red-600 hover:text-red-700'
                          title='Remove member'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => onMembersOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
