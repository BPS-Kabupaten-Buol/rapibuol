import { z } from 'zod'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-provider'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DatePicker } from '@/components/date-picker'
import { SelectDropdown } from '@/components/select-dropdown'
import { getTeams } from '@/features/teams/api/teams'
import { getUnits } from '@/features/units/api/units'
import { createTask, updateTask } from '../api/tasks'
import { type Task } from '../data/schema'

type TaskMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Task
}

const formSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  date: z.date(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  volume: z.number().min(0, 'Volume must be minimum 0'),
  unit: z.number().min(1, 'Please select a unit.'),
  assignor: z.number().min(1, 'Please select a team.'),
  is_done: z.boolean(),
})

type TaskForm = z.infer<typeof formSchema>

export function TasksMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: TaskMutateDrawerProps) {
  const isUpdate = !!currentRow
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: teams = [], isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
  })

  const { data: units = [], isLoading: isLoadingUnits } = useQuery({
    queryKey: ['units'],
    queryFn: getUnits,
  })

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created successfully')
    },
    onError: () => {
      toast.error('Failed to create task')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Parameters<typeof updateTask>[1]
    }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task updated successfully')
    },
    onError: () => {
      toast.error('Failed to update task')
    },
  })

  const form = useForm<TaskForm>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow
      ? {
          description: currentRow.description,
          date: new Date(currentRow.date),
          start_time: currentRow.start_time ?? '',
          end_time: currentRow.end_time ?? '',
          volume: currentRow.volume,
          unit: currentRow.unit,
          assignor: currentRow.assignor,
          is_done: currentRow.is_done,
        }
      : {
          description: '',
          date: new Date(),
          start_time: '',
          end_time: '',
          volume: 0,
          unit: 0,
          assignor: 0,
          is_done: false,
        },
  })

  const onSubmit = (data: TaskForm) => {
    if (!user) {
      toast.error('You must be logged in to create a task')
      return
    }

    const payload = {
      description: data.description,
      date: format(data.date, 'yyyy-MM-dd'),
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      volume: data.volume,
      unit: data.unit,
      assignor: data.assignor,
      is_done: data.is_done,
      user_id: user.id,
    }

    if (isUpdate && currentRow) {
      updateMutation.mutate({ id: currentRow.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }

    onOpenChange(false)
    form.reset()
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        form.reset()
      }}
    >
      <SheetContent className='flex w-full flex-col sm:max-w-md'>
        <SheetHeader className='text-start'>
          <SheetTitle>{isUpdate ? 'Update' : 'Create'} Task</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the task by providing necessary info.'
              : 'Add a new task by providing necessary info.'}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='tasks-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-4 overflow-y-auto px-4 py-2'
          >
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='Enter activity description'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='date'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Tanggal</FormLabel>
                  <DatePicker
                    selected={field.value}
                    onSelect={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex gap-4'>
              <FormField
                control={form.control}
                name='start_time'
                render={({ field }) => (
                  <FormItem className='flex-1'>
                    <FormLabel>Waktu Mulai</FormLabel>
                    <FormControl>
                      <Input type='time' {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='end_time'
                render={({ field }) => (
                  <FormItem className='flex-1'>
                    <FormLabel>Waktu Selesai</FormLabel>
                    <FormControl>
                      <Input type='time' {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='volume'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='unit'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Satuan</FormLabel>
                  {isLoadingUnits ? (
                    <div className='flex h-10 items-center justify-center'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                    </div>
                  ) : (
                    <SelectDropdown
                      defaultValue={
                        field.value ? String(field.value) : undefined
                      }
                      onValueChange={(val) => field.onChange(Number(val))}
                      placeholder='Select a unit'
                      items={units.map((u) => ({
                        label: u.name,
                        value: String(u.id),
                      }))}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='assignor'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignor / Tim</FormLabel>
                  {isLoadingTeams ? (
                    <div className='flex h-10 items-center justify-center'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                    </div>
                  ) : (
                    <SelectDropdown
                      defaultValue={
                        field.value ? String(field.value) : undefined
                      }
                      onValueChange={(val) => field.onChange(Number(val))}
                      placeholder='Select a team'
                      items={teams.map((t) => ({
                        label: t.name,
                        value: String(t.id),
                      }))}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='is_done'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center space-y-0 space-x-3 rounded-md border p-4 shadow'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Tandai Selesai</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2 pt-2'>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
          <Button form='tasks-form' type='submit'>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
