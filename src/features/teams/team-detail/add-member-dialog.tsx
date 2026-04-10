import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useUsers } from '@/features/users/hooks'
import {
  addUserToTeamSchema,
  type AddUserToTeamForm,
  type UserTeamWithUser,
} from '../data/schema'

interface AddMemberDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAddMember: (data: AddUserToTeamForm) => Promise<void>
  currentMembers: UserTeamWithUser[]
}

export function AddMemberDialog({
  isOpen,
  onOpenChange,
  onAddMember,
  currentMembers,
}: AddMemberDialogProps) {
  const { users } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  const form = useForm<AddUserToTeamForm>({
    resolver: zodResolver(addUserToTeamSchema),
    defaultValues: {
      user_id: '',
    },
  })

  const availableUsers = users.filter(
    (user) => !currentMembers.some((member) => member.user_id === user.id)
  )

  const selectedUser = users.find((u) => u.id === form.watch('user_id'))

  const onSubmit = async (data: AddUserToTeamForm) => {
    setIsSubmitting(true)
    try {
      await onAddMember(data)
      toast.success('Member added successfully')
      form.reset()
      setOpen(false)
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add member'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col sm:max-w-md'>
        <SheetHeader className='mb-4'>
          <SheetTitle>Add Team Member</SheetTitle>
          <SheetDescription>
            Select a user to add to this team. They will be able to access all
            team activities and information.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='mx-4 flex flex-1 flex-col space-y-4 py-2'
          >
            <FormField
              control={form.control}
              name='user_id'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Select User</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          role='combobox'
                          className={cn(
                            'w-full justify-between',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <span className='truncate'>
                            {selectedUser
                              ? `${selectedUser.name} (${selectedUser.email})`
                              : 'Choose a user...'}
                          </span>
                          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-full p-0' align='start'>
                      <Command>
                        <CommandInput
                          placeholder='Search users...'
                          className='h-9'
                        />
                        <CommandEmpty>
                          {availableUsers.length === 0
                            ? 'All users are already members'
                            : 'No users found'}
                        </CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {availableUsers.map((user) => (
                              <CommandItem
                                value={user.id}
                                key={user.id}
                                onSelect={(currentValue) => {
                                  field.onChange(
                                    currentValue === field.value
                                      ? ''
                                      : currentValue
                                  )
                                  setOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value === user.id
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                <div className='flex flex-1 flex-col gap-1'>
                                  <span className='font-medium'>
                                    {user.name}
                                  </span>
                                  <span className='text-xs text-muted-foreground'>
                                    {user.email}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='mt-auto flex gap-3 pt-4'>
              <Button
                type='button'
                variant='outline'
                className='flex-1'
                disabled={isSubmitting}
                onClick={() => {
                  form.reset()
                  setOpen(false)
                  onOpenChange(false)
                }}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='flex-1'
                disabled={isSubmitting || !form.watch('user_id')}
              >
                {isSubmitting ? 'Adding...' : 'Add Member'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
