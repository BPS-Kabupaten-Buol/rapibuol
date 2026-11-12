import { useQuery } from '@tanstack/react-query'
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
  Trash2,
  Users,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'
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

export function ActivityDetailDrawer({
  open,
  onOpenChange,
  activity,
  onEdit,
  onDelete,
  onDuplicate,
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
