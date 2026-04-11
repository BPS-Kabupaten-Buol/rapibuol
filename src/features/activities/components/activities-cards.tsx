import { type Table } from '@tanstack/react-table'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Package, Users, Link2, CheckCheck, Clock3, MoreHorizontal, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { useActivities } from './activities-provider'
import { type Activity } from '../data/schema'
import { type Team } from '@/features/teams/api/teams'
import { type Unit } from '@/features/units/api/units'
import { updateActivity } from '../api/activities'

interface ActivitiesCardsProps {
  table: Table<Activity>
  teams: Team[]
  units: Unit[]
}

function calcDuration(start: string | null, end: string | null): string | null {
  if (!start || !end) return null
  try {
    const [h1, m1] = start.split(':').map(Number)
    const [h2, m2] = end.split(':').map(Number)
    const mins = h2 * 60 + m2 - (h1 * 60 + m1)
    if (mins <= 0) return null
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h === 0) return `${m}m`
    return m === 0 ? `${h} jam` : `${h} jam ${m}m`
  } catch {
    return null
  }
}

// ─── Card Actions ────────────────────────────────────────────────────────────

function CardActions({ activity }: { activity: Activity }) {
  const { setOpen, setCurrentRow } = useActivities()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()

  const toggleDone = useMutation({
    mutationFn: () =>
      updateActivity(activity.id, { is_done: !activity.is_done }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className={cn(
            'h-8 w-8 shrink-0 rounded-full transition-opacity focus:opacity-100',
            isMobile
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
          <span className='sr-only'>Buka menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuItem
          className='cursor-pointer'
          onClick={() => toggleDone.mutate()}
          disabled={toggleDone.isPending}
        >
          {activity.is_done ? (
            <>
              <Circle className='mr-2 h-4 w-4 text-amber-500' />
              Tandai Pending
            </>
          ) : (
            <>
              <CheckCircle2 className='mr-2 h-4 w-4 text-emerald-500' />
              Tandai Selesai
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='cursor-pointer'
          onClick={() => {
            setCurrentRow(activity)
            setOpen('update')
          }}
        >
          <Pencil className='mr-2 h-4 w-4' />
          Ubah Aktivitas
        </DropdownMenuItem>
        <DropdownMenuItem
          className='cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive'
          onClick={() => {
            setCurrentRow(activity)
            setOpen('delete')
          }}
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Hapus Aktivitas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ActivitiesCards({ table, teams, units }: ActivitiesCardsProps) {
  const rows = table.getRowModel().rows

  if (rows.length === 0) {
    return (
      <div className='flex h-24 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground'>
        Tidak ada hasil.
      </div>
    )
  }

  return (
    <div className='flex flex-col divide-y divide-border/50 overflow-hidden rounded-xl border bg-card shadow-sm'>
      {rows.map((row, i) => {
        const activity = row.original
        const isDone = activity.is_done
        const duration = calcDuration(activity.start_time, activity.end_time)
        const unitName = units.find((u) => u.id === activity.unit)?.name ?? ''
        const teamName = teams.find((t) => t.id === activity.assignor)?.name ?? '-'

        return (
          <div
            key={row.id}
            className={cn(
              'group relative flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/30',
              i === 0 && 'rounded-t-xl',
              i === rows.length - 1 && 'rounded-b-xl'
            )}
          >
            {/* Accent dot */}
            <div
              className={cn(
                'mt-[7px] h-2 w-2 shrink-0 rounded-full ring-2 ring-offset-2',
                isDone
                  ? 'bg-emerald-400 ring-emerald-200'
                  : 'bg-amber-400 ring-amber-200'
              )}
            />

            <div className='flex flex-1 flex-col gap-2 min-w-0'>
              {/* Time + Duration + Status */}
              <div className='flex flex-wrap items-center gap-2'>
                <span className='inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground'>
                  <Clock className='h-3 w-3' />
                  {activity.start_time?.slice(0, 5) ?? '--:--'} – {activity.end_time?.slice(0, 5) ?? '--:--'}
                </span>

                {duration && (
                  <span className='rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground/70 tabular-nums'>
                    {duration}
                  </span>
                )}

                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold',
                    isDone
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                  )}
                >
                  {isDone ? (
                    <CheckCheck className='h-3 w-3' />
                  ) : (
                    <Clock3 className='h-3 w-3' />
                  )}
                  {isDone ? 'Selesai' : 'Pending'}
                </span>
              </div>

              {/* Description */}
              <p
                className={cn(
                  'text-[15px] font-semibold leading-snug'
                )}
              >
                {activity.description}
              </p>

              {/* Metadata */}
              <div className='flex flex-wrap items-center gap-x-5 gap-y-1 pt-0.5'>
                <span className='inline-flex items-center gap-1.5 text-xs text-muted-foreground'>
                  <Package className='h-3.5 w-3.5 text-muted-foreground/50' />
                  {activity.volume} {unitName}
                </span>
                <span className='inline-flex items-center gap-1.5 text-xs text-muted-foreground'>
                  <Users className='h-3.5 w-3.5 text-muted-foreground/50' />
                  {teamName}
                </span>
                {activity.link_bukti_dukung && (
                  <a
                    href={activity.link_bukti_dukung}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 hover:underline'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link2 className='h-3.5 w-3.5' />
                    Bukti Dukung
                  </a>
                )}
              </div>
            </div>

            {/* Actions */}
            <CardActions activity={activity} />
          </div>
        )
      })}
    </div>
  )
}
