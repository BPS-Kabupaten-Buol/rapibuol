import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AlarmClock, Bell, CheckCheck, CheckCircle2, CircleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-provider'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getActivities } from '@/features/activities/api/activities'
import {
  buildActivityNotifications,
  type ActivityNotification,
} from '@/features/activities/lib/activity-notifications'

const MAX_VISIBLE = 8
const STORAGE_PREFIX = 'rapibuol:notif-dismissed:'

/**
 * Fitur notifikasi sedang disembunyikan. Ubah ke true kalau mau memunculkan
 * loncengnya lagi di header — tidak ada bagian lain yang perlu diubah.
 */
const NOTIFICATION_BELL_ENABLED = false

/** Identitas notifikasi: kalau tenggat berubah, notifikasi muncul lagi. */
function signature(notification: ActivityNotification): string {
  return `${notification.kind}:${notification.id}:${notification.deadline}`
}

function readDismissed(userId: string | undefined): string[] {
  if (!userId) return []

  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

function writeDismissed(userId: string, signatures: string[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(signatures))
  } catch {
    /* penyimpanan penuh atau mode privat; abaikan */
  }
}

export function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [cleared, setCleared] = useState<{
    userId: string
    signatures: string[]
  } | null>(null)

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', user?.id],
    queryFn: () => getActivities(user?.id),
    enabled: NOTIFICATION_BELL_ENABLED && !!user?.id,
  })

  const notifications = useMemo(
    () => buildActivityNotifications(activities),
    [activities]
  )

  // Dibaca dari localStorage saat render; `cleared` menampung hasil tombol
  // Bersihkan tanpa perlu effect.
  const storedDismissed = useMemo(() => readDismissed(user?.id), [user?.id])
  const dismissed =
    cleared && cleared.userId === user?.id ? cleared.signatures : storedDismissed

  const dismissedSet = useMemo(() => new Set(dismissed), [dismissed])
  const visible = useMemo(
    () => notifications.filter((item) => !dismissedSet.has(signature(item))),
    [notifications, dismissedSet]
  )

  const total = visible.length
  const overdue = visible.filter((item) => item.kind === 'overdue').length
  const dueToday = total - overdue

  const goToActivities = () => {
    setOpen(false)
    navigate({ to: '/activities' })
  }

  const clearAll = () => {
    if (!user?.id) return

    const signatures = notifications.map(signature)
    writeDismissed(user.id, signatures)
    setCleared({ userId: user.id, signatures })
  }

  if (!NOTIFICATION_BELL_ENABLED) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative h-9 w-9'
          aria-label={
            total > 0 ? `Notifikasi, ${total} perlu ditindak` : 'Notifikasi'
          }
          title='Notifikasi'
        >
          <Bell className='h-4 w-4' />
          {total > 0 && (
            <span className='absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-white'>
              {total > 9 ? '9+' : total}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align='end' className='w-80 p-0'>
        <div className='space-y-1 border-b px-3 py-2'>
          <div className='flex items-center justify-between gap-2'>
            <p className='text-sm font-semibold'>Notifikasi</p>
            {notifications.length > 0 && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 gap-1 px-2 text-[11px]'
                onClick={clearAll}
              >
                <CheckCheck className='h-3.5 w-3.5' />
                Bersihkan
              </Button>
            )}
          </div>

          {total > 0 ? (
            <p className='text-[11px] text-muted-foreground tabular-nums'>
              {overdue > 0 && `${overdue} terlambat`}
              {overdue > 0 && dueToday > 0 && ' · '}
              {dueToday > 0 && `${dueToday} tenggat hari ini`}
            </p>
          ) : (
            notifications.length > 0 && (
              <p className='text-[11px] text-muted-foreground'>
                Sudah dibersihkan
              </p>
            )
          )}
        </div>

        <ScrollArea className='max-h-80'>
          {isLoading ? (
            <p className='px-3 py-6 text-center text-sm text-muted-foreground'>
              Memuat...
            </p>
          ) : total === 0 ? (
            <div className='flex flex-col items-center gap-2 px-4 py-8 text-center'>
              <CheckCircle2 className='h-6 w-6 text-emerald-500' />
              <p className='text-sm text-muted-foreground'>
                {notifications.length === 0
                  ? 'Tidak ada yang perlu ditindak.'
                  : 'Semua notifikasi sudah dibersihkan.'}
              </p>
            </div>
          ) : (
            <ul className='divide-y'>
              {visible.slice(0, MAX_VISIBLE).map((item) => (
                <li key={signature(item)}>
                  <button
                    type='button'
                    onClick={goToActivities}
                    className='flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/60'
                  >
                    {item.kind === 'overdue' ? (
                      <CircleAlert className='mt-0.5 h-4 w-4 shrink-0 text-destructive' />
                    ) : (
                      <AlarmClock className='mt-0.5 h-4 w-4 shrink-0 text-amber-500' />
                    )}
                    <span className='min-w-0'>
                      <span className='block truncate text-sm font-medium'>
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          'text-[11px]',
                          item.kind === 'overdue'
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        )}
                      >
                        {item.meta}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {total > MAX_VISIBLE && (
          <p className='border-t px-3 py-1.5 text-[11px] text-muted-foreground'>
            +{total - MAX_VISIBLE} lainnya
          </p>
        )}

        {notifications.length > 0 && (
          <div className='border-t p-2'>
            <Button
              variant='ghost'
              size='sm'
              className='w-full text-xs'
              onClick={goToActivities}
            >
              Lihat semua aktivitas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
