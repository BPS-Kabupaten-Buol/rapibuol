import { useEffect, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useUsers } from '@/features/users/hooks'
import {
  createTeamSchema,
  updateTeamSchema,
  type CreateTeamForm,
  type UpdateTeamForm,
} from '../data/schema'
import { useTeamDialog } from './teams-provider'

export function TeamsActionDialog() {
  const {
    isCreateOpen,
    isEditOpen,
    onCreateOpen,
    onEditDialogOpen,
    selectedTeam,
  } = useTeamDialog()
  const { createTeam, updateTeam } = useTeamDialog()
  const { users } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [leaderPopoverOpen, setLeaderPopoverOpen] = useState(false)

  const isEditMode = isEditOpen && selectedTeam

  const form = useForm<CreateTeamForm | UpdateTeamForm>({
    resolver: zodResolver(isEditMode ? updateTeamSchema : createTeamSchema),
    defaultValues: {
      name: '',
      leader: '',
    },
  })

  useEffect(() => {
    if (isEditMode && selectedTeam) {
      form.reset({
        name: selectedTeam.name,
        leader: selectedTeam.leader,
      })
    } else if (isCreateOpen) {
      form.reset({
        name: '',
        leader: '',
      })
    }
  }, [isEditMode, isCreateOpen, selectedTeam, form])

  const onSubmit = async (data: CreateTeamForm | UpdateTeamForm) => {
    setIsSubmitting(true)
    try {
      if (isEditMode && selectedTeam) {
        await updateTeam(selectedTeam.id, data as UpdateTeamForm)
        toast.success('Tim berhasil diperbarui!')
        onEditDialogOpen(false)
      } else {
        await createTeam(data as CreateTeamForm)
        toast.success('Tim berhasil dibuat!')
        onCreateOpen(false)
      }
      form.reset()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal menyimpan tim'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isOpen = isCreateOpen || isEditOpen
  const onOpenChange = (open: boolean) => {
    if (!open) setLeaderPopoverOpen(false)
    if (isEditMode) {
      onEditDialogOpen(open)
    } else {
      onCreateOpen(open)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Ubah Tim' : 'Buat Tim Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Perbarui informasi tim di bawah ini.'
              : 'Tambah tim baru ke ruang kerja Anda.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Tim</FormLabel>
                  <FormControl>
                    <Input placeholder='misal: Tim Produksi' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='leader'
              render={({ field }) => {
                const selectedUser = users.find((u) => u.id === field.value)
                return (
                  <FormItem className='flex flex-col'>
                    <FormLabel>Ketua Tim</FormLabel>
                    <Popover
                      open={leaderPopoverOpen}
                      onOpenChange={setLeaderPopoverOpen}
                    >
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
                                ? selectedUser.name
                                : 'Pilih ketua tim'}
                            </span>
                            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className='w-[var(--radix-popover-trigger-width)] p-0'
                        align='start'
                      >
                        <Command>
                          <CommandInput
                            placeholder='Cari pengguna...'
                            className='h-9'
                          />
                          <CommandList>
                            <CommandEmpty>Pengguna tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {users.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={`${user.name} ${user.email}`}
                                  onSelect={() => {
                                    field.onChange(user.id)
                                    setLeaderPopoverOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4 shrink-0',
                                      field.value === user.id
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                  <div className='flex flex-col'>
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
                )
              }}
            />

            <div className='flex gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                className='flex-1'
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type='submit' className='flex-1' disabled={isSubmitting}>
                {isSubmitting
                  ? isEditMode
                    ? 'Memperbarui...'
                    : 'Membuat...'
                  : isEditMode
                    ? 'Ubah Tim'
                    : 'Buat Tim'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
