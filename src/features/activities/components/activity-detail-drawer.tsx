import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type LucideIcon,
  CalendarDays,
  CalendarPlus,
  Clock,
  Copy,
  ExternalLink,
  MapPin,
  Package,
  Pencil,
  StickyNote,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { getTeams } from '@/features/teams/api/teams'
import { getUnits } from '@/features/units/api/units'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { updateActivity } from '../api/activities'
import { isMissingColumn, missingColumnHint } from '../lib/schema-column-error'
import { formatActivityTime } from '../lib/activity-time'
import { getActivityCalendarUrl } from '../lib/google-calendar-link'
import { ActivityDoneToggle } from './activity-done-toggle'
import { type Activity } from '../data/schema'

type ActivityDetailDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: Activity | null
  onEdit: (activity: Activity) => void
  onDelete: (activity: Activity) => void
  onDuplicate: (activity: Activity) => void
  /** Dipanggil setelah catatan tersimpan, supaya salinan di drawer ikut segar. */
  onNotesSaved: (activity: Activity, notes: string | null) => void
}

function formatDateLabel(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value

  return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='flex gap-3'>
      <div className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted'>
        <Icon className='h-4 w-4 text-muted-foreground' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-xs text-muted-foreground'>{label}</p>
        <div className='text-sm break-words'>{children}</div>
      </div>
    </div>
  )
}

/** Editor catatan langsung di drawer detail, tersimpan otomatis. */
function NotesEditor({
  activity,
  onSaved,
}: {
  activity: Activity
  onSaved: (activity: Activity, notes: string | null) => void
}) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState(activity.notes ?? '')
  const savedRef = useRef(activity.notes ?? '')
  // Catatan dikirim berurutan supaya ketikan lama tidak menimpa yang baru.
  const queueRef = useRef<Promise<unknown>>(Promise.resolve())

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (notes: string) =>
      updateActivity(activity.id, { notes: notes || null }),
    onSuccess: (updated) => {
      savedRef.current = updated.notes ?? ''
      onSaved(updated, updated.notes ?? null)
      // Cukup tempel di cache: catatan tidak memengaruhi urutan atau rekap.
      queryClient.setQueriesData<Activity[]>(
        { queryKey: ['activities'] },
        (list) =>
          list?.map((item) =>
            item.id === updated.id ? { ...item, notes: updated.notes } : item
          )
      )
    },
    onError: (error) => {
      toast.error(
        isMissingColumn(error, 'notes')
          ? missingColumnHint(
              'notes',
              'docs/migrations/2026-11-12-activity-notes.sql'
            )
          : 'Gagal menyimpan catatan'
      )
    },
  })

  const flush = useCallback(
    (value: string) => {
      const next = value.trim()
      if (next === savedRef.current) return

      queueRef.current = queueRef.current.then(() =>
        mutateAsync(next).catch(() => undefined)
      )
    },
    [mutateAsync]
  )

  // Jeda 800 ms setelah berhenti mengetik.
  useEffect(() => {
    if (draft.trim() === savedRef.current) return

    const timer = window.setTimeout(() => flush(draft), 800)
    return () => window.clearTimeout(timer)
  }, [draft, flush])

  return (
    <div className='space-y-1'>
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => flush(draft)}
        onKeyDown={(event) => {
          // Esc menutup drawer; simpan dulu sebelum ketikan terakhir hilang.
          if (event.key === 'Escape') flush(draft)
        }}
        placeholder='Tambah catatan...'
        className='min-h-[72px] resize-none text-sm'
      />

      {isPending && (
        <p className='text-xs text-muted-foreground'>Menyimpan...</p>
      )}
    </div>
  )
}

export function ActivityDetailDrawer({
  open,
  onOpenChange,
  activity,
  onEdit,
  onDelete,
  onDuplicate,
  onNotesSaved,
}: ActivityDetailDrawerProps) {
  const { data: teams = [] } = useQuery({
    queryKey: ['teams', 'options'],
    queryFn: getTeams,
    enabled: open,
  })

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: getUnits,
    enabled: open,
  })

  const unitName = units.find((unit) => unit.id === activity?.unit)?.name ?? null
  const teamName =
    teams.find((team) => team.id === activity?.assignor)?.name ?? null
  const time = activity
    ? formatActivityTime(activity.start_time, activity.end_time)
    : null
  const calendarUrl = activity
    ? getActivityCalendarUrl(activity, { unitName, teamName })
    : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col sm:max-w-md'>
        <SheetHeader className='text-start'>
          <SheetTitle className='pr-8 break-words'>
            {activity?.description ?? 'Detail Aktivitas'}
          </SheetTitle>
          <SheetDescription>
            Detail aktivitas yang tercatat di RapiBuol.
          </SheetDescription>
        </SheetHeader>

        {activity && (
          <div className='flex-1 space-y-4 overflow-y-auto px-4 py-2'>
            <div className='flex items-center gap-2'>
              <ActivityDoneToggle activity={activity} />
              <Badge
                variant={activity.is_done ? 'default' : 'secondary'}
                className={cn(activity.is_done && 'bg-emerald-500')}
              >
                {activity.is_done ? 'Selesai' : 'Belum selesai'}
              </Badge>
            </div>

            <div className='flex flex-wrap gap-2'>
              {calendarUrl && (
                <Button variant='outline' size='sm' className='gap-1' asChild>
                  <a
                    href={calendarUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <CalendarPlus className='h-4 w-4' />
                    Tambah ke Google Calendar
                  </a>
                </Button>
              )}

              <Button
                variant='outline'
                size='sm'
                className='gap-1'
                onClick={() => onDuplicate(activity)}
              >
                <Copy className='h-4 w-4' />
                Duplikat
              </Button>
            </div>

            <DetailRow icon={CalendarDays} label='Tanggal'>
              {formatDateLabel(activity.date)}
              {activity.end_date && (
                <span className='block text-muted-foreground'>
                  sampai {formatDateLabel(activity.end_date)}
                </span>
              )}
            </DetailRow>

            <DetailRow icon={StickyNote} label='Catatan'>
              <NotesEditor
                key={activity.id}
                activity={activity}
                onSaved={onNotesSaved}
              />
            </DetailRow>

            {time && (
              <DetailRow icon={Clock} label='Jam'>
                {time}
              </DetailRow>
            )}

            {activity.volume !== null && (
              <DetailRow icon={Package} label='Volume'>
                {activity.volume}
                {unitName ? ` ${unitName}` : ''}
              </DetailRow>
            )}

            {teamName && (
              <DetailRow icon={Users} label='Tim'>
                {teamName}
              </DetailRow>
            )}

            {activity.link_bukti_dukung && (
              <DetailRow icon={ExternalLink} label='Bukti dukung'>
                <a
                  href={activity.link_bukti_dukung}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='break-all text-blue-600 hover:underline dark:text-blue-400'
                >
                  {activity.link_bukti_dukung}
                </a>
              </DetailRow>
            )}

            {activity.coordinates && (
              <DetailRow icon={MapPin} label='Koordinat'>
                <a
                  href={`https://www.google.com/maps/search/${activity.coordinates}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='break-all text-blue-600 hover:underline dark:text-blue-400'
                >
                  {activity.coordinates}
                </a>
              </DetailRow>
            )}
          </div>
        )}

        <SheetFooter className='flex-row justify-between gap-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Tutup
          </Button>

          <div className='flex gap-2'>
            <Button
              variant='destructive'
              className='gap-1'
              disabled={!activity}
              onClick={() => activity && onDelete(activity)}
            >
              <Trash2 className='h-4 w-4' />
              Hapus
            </Button>
            <Button
              className='gap-1'
              disabled={!activity}
              onClick={() => activity && onEdit(activity)}
            >
              <Pencil className='h-4 w-4' />
              Ubah Aktivitas
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
