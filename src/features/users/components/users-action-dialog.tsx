'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/multi-select'
import { PasswordInput } from '@/components/password-input'
import { useTeams, useRoles, useUsers } from '../hooks'

const formSchema = z
  .object({
    email: z.string().email('Please enter a valid email'),
    fullName: z.string().min(1, 'Display name is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    teamIds: z.array(z.number()).optional(),
    roleIds: z.array(z.number()).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type UserForm = z.infer<typeof formSchema>

type UsersActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({
  open,
  onOpenChange,
}: UsersActionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { teams } = useTeams()
  const { roles } = useRoles()
  const { addUser, fetchUsers } = useUsers()

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
      teamIds: undefined,
      roleIds: undefined,
    },
  })

  const onSubmit = async (values: UserForm) => {
    setIsLoading(true)
    try {
      await addUser({
        email: values.email,
        fullName: values.fullName,
        password: values.password,
        confirmPassword: values.confirmPassword,
        teamIds: values.teamIds,
        roleIds: values.roleIds,
      })
      toast.success('User created successfully')
      form.reset()

      // Refetch users to auto-refresh table
      await fetchUsers()

      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create user'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[60vh] overflow-y-auto py-1'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-1'
            >
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder='john.doe@example.com' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='fullName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder='John Doe' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='teamIds'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teams</FormLabel>
                    <FormControl>
                      <MultiSelect
                        value={field.value ?? []}
                        onChange={field.onChange}
                        options={teams.map((t) => ({
                          label: t.name,
                          value: t.id,
                        }))}
                        placeholder='Select teams (optional)'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='roleIds'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roles</FormLabel>
                    <FormControl>
                      <MultiSelect
                        value={field.value ?? []}
                        onChange={field.onChange}
                        options={roles.map((r) => ({
                          label: r.name,
                          value: r.id,
                        }))}
                        placeholder='Select roles (optional)'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder='********' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder='********' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='user-form' disabled={isLoading}>
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
