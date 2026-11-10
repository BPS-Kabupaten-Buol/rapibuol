import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  addMonths,
  format,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useAuth } from '@/context/auth-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { NotificationBell } from '@/components/notification-bell'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { cn } from '@/lib/utils'
import { getActivities } from '@/features/activities/api/activities'
import { ActivitiesDialogs } from '@/features/activities/components/activities-dialogs'
import { ActivityDoneToggle } from '@/features/activities/components/activity-done-toggle'
import {
  ActivitiesProvider,
  useActivities,
} from '@/features/activities/components/activities-provider'
import { useMoveActivity } from '@/features/activities/hooks/use-move-activity'
import { MonthGrid } from './components/month-grid'
import { groupActivitiesByDay } from './lib/group-activities-by-day'

function CalendarContent() {
  const { user } = useAuth()
  const { setOpen, setDefaultDate, setDefaultQuadrant, setDetailActivity } =
    useActivities()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const moveActivity = useMoveActivity()

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', user?.id],
    queryFn: () => getActivities(user?.id),
    enabled: !!user?.id,
  })

  const activitiesByDay = useMemo(
    () => groupActivitiesByDay(activities),
    [activities]
  )

  const selectedKey = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null
  const selectedActivities = selectedKey
    ? (activitiesByDay.get(selectedKey) ?? [])
    : []

  const handleCreateForDay = () => {
    setDefaultDate(selectedDay ?? null)
    setDefaultQuadrant(null)
    setOpen('create')
    setSelectedDay(null)
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <NotificationBell />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Kalender</h2>
            <p className='text-muted-foreground'>
              Aktivitas Anda dalam tampilan bulan.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='icon'
              aria-label='Bulan sebelumnya'
              onClick={() => setMonth((current) => subMonths(current, 1))}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              onClick={() => setMonth(startOfMonth(new Date()))}
            >
              Hari Ini
            </Button>
            <Button
              variant='outline'
              size='icon'
              aria-label='Bulan berikutnya'
              onClick={() => setMonth((current) => addMonths(current, 1))}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>

        <Card className='gap-0 overflow-hidden py-0'>
          <div className='flex items-center justify-between gap-3 border-b px-4 py-3'>
            <h3 className='truncate font-semibold capitalize'>
              {month.toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric',
              })}
            </h3>
            <Button
              size='sm'
              className='gap-1'
              onClick={() => {
                setDefaultDate(null)
                setDefaultQuadrant(null)
                setOpen('create')
              }}
            >
              <Plus className='h-4 w-4' />
              <span className='max-sm:hidden'>Aktivitas</span>
            </Button>
          </div>

          <MonthGrid
            month={month}
            activities={activities}
            activitiesByDay={activitiesByDay}
            onSelectDay={setSelectedDay}
            onSelectActivity={setDetailActivity}
            onMoveActivity={(activity, deltaDays) =>
              moveActivity.mutate({ activity, deltaDays })
            }
          />
        </Card>

        {isLoading && (
          <p className='text-sm text-muted-foreground'>Memuat aktivitas...</p>
        )}

        <Dialog
          open={!!selectedDay}
          onOpenChange={(open) => {
            if (!open) setSelectedDay(null)
          }}
        >
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>
                {selectedDay
                  ? selectedDay.toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : ''}
              </DialogTitle>
              <DialogDescription>
                {selectedActivities.length} aktivitas pada hari ini.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className='max-h-[55vh] min-w-0'>
              <ul className='w-full divide-y'>
                {selectedActivities.map((activity) => (
                  <li
                    key={activity.id}
                    className='flex items-start gap-2 p-3 transition-colors hover:bg-muted/50'
                  >
                    <ActivityDoneToggle activity={activity} className='mt-0.5' />
                    <button
                      type='button'
                      className='min-w-0 flex-1 text-left'
                      onClick={() => {
                        setDetailActivity(activity)
                      }}
                    >
                      <p
                        className={cn(
                          'text-sm font-medium break-words',
                          activity.is_done &&
                            'text-muted-foreground line-through'
                        )}
                      >
                        {activity.description}
                      </p>
                      <p className='mt-0.5 text-xs text-muted-foreground tabular-nums'>
                        {(activity.start_time ?? '--:--').slice(0, 5)} &ndash;{' '}
                        {(activity.end_time ?? '--:--').slice(0, 5)}
                        {activity.end_date && (
                          <span>
                            {' '}
                            &middot; s/d{' '}
                            {new Date(activity.end_date).toLocaleDateString(
                              'id-ID',
                              {
                                day: 'numeric',
                                month: 'short',
                              }
                            )}
                          </span>
                        )}
                      </p>
                    </button>
                  </li>
                ))}

                {selectedActivities.length === 0 && (
                  <li className='p-6 text-center text-sm text-muted-foreground'>
                    Tidak ada aktivitas pada hari ini.
                  </li>
                )}
              </ul>
            </ScrollArea>

            <div className='mt-3 flex justify-end'>
              <Button className='gap-1' onClick={handleCreateForDay}>
                <Plus className='h-4 w-4' />
                Tambah Aktivitas
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Main>

      <ActivitiesDialogs />
    </>
  )
}

export function CalendarPage() {
  return (
    <ActivitiesProvider>
      <CalendarContent />
    </ActivitiesProvider>
  )
}
