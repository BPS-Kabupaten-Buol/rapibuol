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
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/date-picker'
import { SelectDropdown } from '@/components/select-dropdown'
import { getTeams } from '@/features/teams/api/teams'
import { getUnits } from '@/features/units/api/units'
import { createActivity, updateActivity } from '../api/activities'
import { type Activity } from '../data/schema'

type ActivityMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Activity
}

const formSchema = z.object({
  description: z.string().min(1, 'Deskripsi harus diisi.'),
  date: z.date(),
  end_date: z.date().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  volume: z.number().min(0, 'Volume minimal 0').nullable().optional(),
  unit: z.number().min(1, 'Silakan pilih satuan.').nullable().optional(),
  assignor: z.number().nullable().optional(),
  is_done: z.boolean(),
  link_bukti_dukung: z.string().optional(),
  coordinates: z.string().optional(),
})

type ActivityForm = z.infer<typeof formSchema>

export function ActivitiesMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: ActivityMutateDrawerProps) {
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
    mutationFn: createActivity,
    onMutate: async (newActivity) => {
      await queryClient.cancelQueries({ queryKey: ['activities', user?.id] })
      if (user) {
        await queryClient.cancelQueries({ queryKey: ['tasks_today', user.id] })
        await queryClient.cancelQueries({ queryKey: ['stats', user.id] })
      }

      const previousActivities = user
        ? queryClient.getQueryData(['activities', user.id])
        : undefined
      const previousTodayTasks = user
        ? queryClient.getQueryData(['tasks_today', user.id])
        : undefined
      const previousStats = user
        ? queryClient.getQueryData(['stats', user.id])
        : undefined

      const optimisticActivity = {
        id: Math.random(),
        ...newActivity,
        unit: units.find((u) => u.id === newActivity.unit),
        assignor_team: teams.find((t) => t.id === newActivity.assignor),
      }

      if (user) {
        queryClient.setQueryData(['activities', user.id], (old: any) => [
          optimisticActivity,
          ...(old || []),
        ])
      }

      if (user) {
        const today = format(new Date(), 'yyyy-MM-dd')
        if (newActivity.date === today) {
          queryClient.setQueryData(['tasks_today', user.id], (old: any) => [
            optimisticActivity,
            ...(old || []),
          ])
        }

        const isThisMonth = newActivity.date.startsWith(today.substring(0, 7))
        if (isThisMonth) {
          queryClient.setQueryData(['stats', user.id], (old: any) => {
            if (!old) return old
            return {
              ...old,
              totalVolume: (old.totalVolume || 0) + (newActivity.volume || 0),
              pendingCount: newActivity.is_done
                ? old.pendingCount
                : (old.pendingCount || 0) + 1,
            }
          })
        }
      }

      return { previousActivities, previousTodayTasks, previousStats }
    },
    onError: (_err, _newActivity, context) => {
      if (context?.previousActivities && user) {
        queryClient.setQueryData(
          ['activities', user.id],
          context.previousActivities
        )
      }
      if (context?.previousTodayTasks && user) {
        queryClient.setQueryData(
          ['tasks_today', user.id],
          context.previousTodayTasks
        )
      }
      if (context?.previousStats && user) {
        queryClient.setQueryData(['stats', user.id], context.previousStats)
      }
      toast.error('Gagal membuat aktivitas')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['heatmap'] })
      queryClient.invalidateQueries({ queryKey: ['tasks_today'] })
    },
    onSuccess: () => {
      toast.success('Aktivitas berhasil dibuat')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Parameters<typeof updateActivity>[1]
    }) => updateActivity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success('Aktivitas berhasil diperbarui')
    },
    onError: () => {
      toast.error('Gagal memperbarui aktivitas')
    },
  })

  const form = useForm<ActivityForm>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow
      ? {
          description: currentRow.description,
          date: new Date(currentRow.date),
          end_date: currentRow.end_date
            ? new Date(currentRow.end_date)
            : undefined,
          start_time: currentRow.start_time ?? '',
          end_time: currentRow.end_time ?? '',
          volume: currentRow.volume ?? null,
          unit: currentRow.unit ?? null,
          assignor: currentRow.assignor ?? null,
          is_done: currentRow.is_done,
          link_bukti_dukung: currentRow.link_bukti_dukung ?? '',
          coordinates: currentRow.coordinates ?? '',
        }
      : {
          description: '',
          date: new Date(),
          end_date: undefined,
          start_time: '',
          end_time: '',
          volume: null,
          unit: null,
          assignor: null,
          is_done: false,
          link_bukti_dukung: '',
          coordinates: '',
        },
  })

  const onSubmit = (data: ActivityForm) => {
    if (!user) {
      toast.error('Anda harus masuk untuk membuat aktivitas')
      return
    }

    const payload = {
      description: data.description,
      date: format(data.date, 'yyyy-MM-dd'),
      end_date: data.end_date ? format(data.end_date, 'yyyy-MM-dd') : null,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      volume: data.volume || null,
      unit: data.unit || null,
      assignor: data.assignor || null,
      link_bukti_dukung: data.link_bukti_dukung || null,
      coordinates: data.coordinates || null,
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
          <SheetTitle>{isUpdate ? 'Perbarui' : 'Buat'} Aktivitas</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Perbarui aktivitas dengan mengisi informasi yang diperlukan.'
              : 'Tambahkan aktivitas baru dengan mengisi informasi yang diperlukan.'}
            Klik simpan jika sudah selesai.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='activities-form'
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
                    {/* Ganti Input menjadi Textarea */}
                    <Textarea
                      {...field}
                      placeholder='Masukkan deskripsi aktivitas'
                      className='min-h-[100px] resize-none' // resize-none jika ingin ukurannya tetap
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

            <FormField
              control={form.control}
              name='end_date'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Tanggal Berakhir (Opsional)</FormLabel>
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
                  <FormLabel>Volume (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === '' ? null : Number(e.target.value)
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
                  <FormLabel>Satuan (Opsional)</FormLabel>
                  {isLoadingUnits ? (
                    <div className='flex h-10 items-center justify-center'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                    </div>
                  ) : (
                    <SelectDropdown
                      defaultValue={
                        field.value ? String(field.value) : undefined
                      }
                      onValueChange={(val) =>
                        field.onChange(val ? Number(val) : null)
                      }
                      placeholder='Pilih satuan'
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
                  <FormLabel>Tim Pemberi Tugas (Opsional)</FormLabel>
                  {isLoadingTeams ? (
                    <div className='flex h-10 items-center justify-center'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                    </div>
                  ) : (
                    <SelectDropdown
                      defaultValue={
                        field.value ? String(field.value) : undefined
                      }
                      onValueChange={(val) =>
                        field.onChange(val ? Number(val) : null)
                      }
                      placeholder='Pilih tim'
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
              name='link_bukti_dukung'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Bukti Dukung (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='Masukkan link bukti dukung'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='coordinates'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Koordinat (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='Masukkan koordinat (contoh: 1.1725404, 121.4214115)'
                    />
                  </FormControl>
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
            <Button variant='outline'>Tutup</Button>
          </SheetClose>
          <Button form='activities-form' type='submit'>
            Simpan
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
