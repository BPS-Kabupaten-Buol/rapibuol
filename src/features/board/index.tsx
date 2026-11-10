import { useMemo, useState, type DragEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CalendarDays, CheckCheck, ChevronDown, Clock, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { NotificationBell } from '@/components/notification-bell'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { getActivities } from '@/features/activities/api/activities'
import { ActivitiesDialogs } from '@/features/activities/components/activities-dialogs'
import { ActivityDoneToggle } from '@/features/activities/components/activity-done-toggle'
import {
  ActivitiesProvider,
  useActivities,
} from '@/features/activities/components/activities-provider'
import { ActivitiesPrimaryButtons } from '@/features/activities/components/activities-primary-buttons'
import { type Activity } from '@/features/activities/data/schema'
import { useUpdateBoardCard } from './hooks/use-update-board-card'
import {
  BOARD_QUADRANTS,
  groupActivitiesIntoQuadrants,
  type BoardColumn,
  type BoardQuadrant,
} from './lib/group-activities-into-quadrants'

function formatRange(activity: Activity): string {
  const start = format(parseISO(activity.date), 'd MMM', { locale: localeId })

  if (!activity.end_date) return start

  return `${start} – ${format(parseISO(activity.end_date), 'd MMM', {
    locale: localeId,
  })}`
}

function BoardCard({
  activity,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  activity: Activity
  isDragging: boolean
  onDragStart: (event: DragEvent<HTMLDivElement>) => void
  onDragEnd: () => void
}) {
  const { setDetailActivity } = useActivities()

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'cursor-grab rounded-lg border bg-card p-3 shadow-sm transition active:cursor-grabbing',
        'focus-within:ring-2 focus-within:ring-ring/40',
        isDragging && 'opacity-40'
      )}
    >
      <div className='flex items-start gap-2'>
        <ActivityDoneToggle activity={activity} className='mt-0.5' />

        <button
          type='button'
          onClick={() => setDetailActivity(activity)}
          className='min-w-0 flex-1 text-left'
        >
          <p
            className={cn(
              'text-sm leading-snug font-medium break-words',
              activity.is_done && 'text-muted-foreground line-through'
            )}
          >
            {activity.description}
          </p>

          <div className='mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground'>
            <span className='inline-flex items-center gap-1'>
              <CalendarDays className='h-3 w-3' />
              {formatRange(activity)}
            </span>

            {activity.start_time && (
              <span className='inline-flex items-center gap-1 tabular-nums'>
                <Clock className='h-3 w-3' />
                {activity.start_time.slice(0, 5)}
                {activity.end_time ? ` – ${activity.end_time.slice(0, 5)}` : ''}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}

function BoardContent() {
  const { user } = useAuth()
  const { setOpen, setDefaultDate, setDefaultQuadrant } = useActivities()
  const updateCard = useUpdateBoardCard()
  const [dragging, setDragging] = useState<Activity | null>(null)
  const [hoverTarget, setHoverTarget] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', user?.id],
    queryFn: () => getActivities(user?.id),
    enabled: !!user?.id,
  })

  const { columns, done } = useMemo(
    () => groupActivitiesIntoQuadrants(activities),
    [activities]
  )

  const resetDrag = () => {
    setDragging(null)
    setHoverTarget(null)
  }

  const dropOnQuadrant =
    (column: BoardColumn) => (event: DragEvent<HTMLElement>) => {
      event.preventDefault()

      const activity = dragging
      resetDrag()
      if (!activity) return

      if (activity.is_done) {
        updateCard.mutate({ activity, quadrant: column.id, isDone: false })
        return
      }

      if ((activity.quadrant ?? 'do-first') !== column.id) {
        updateCard.mutate({ activity, quadrant: column.id })
      }
    }

  const renderCard = (activity: Activity) => (
    <BoardCard
      key={activity.id}
      activity={activity}
      isDragging={dragging?.id === activity.id}
      onDragStart={(event) => {
        setDragging(activity)
        event.dataTransfer.effectAllowed = 'move'
        try {
          event.dataTransfer.setData('text/plain', String(activity.id))
        } catch {
          /* sebagian browser membatasi dataTransfer */
        }
      }}
      onDragEnd={resetDrag}
    />
  )

  const quadrantProps = (quadrant: BoardQuadrant) => ({
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!dragging) return

      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      if (hoverTarget !== quadrant.id) setHoverTarget(quadrant.id)
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      const next = event.relatedTarget as Node | null
      if (next && event.currentTarget.contains(next)) return
      if (hoverTarget === quadrant.id) setHoverTarget(null)
    },
  })

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
          <h2 className='text-2xl font-bold tracking-tight'>Board</h2>
          <ActivitiesPrimaryButtons />
        </div>

        {isLoading ? (
          <p className='text-sm text-muted-foreground'>Memuat aktivitas...</p>
        ) : (
          <div className='flex flex-1 gap-4 overflow-x-auto pb-2'>
            {BOARD_QUADRANTS.map((quadrant) => {
              const column = columns.find((item) => item.id === quadrant.id)
              const list = column?.activities ?? []
              const isTarget = dragging !== null && hoverTarget === quadrant.id

              return (
                <section
                  key={quadrant.id}
                  {...quadrantProps(quadrant)}
                  onDrop={dropOnQuadrant(
                    column ?? { ...quadrant, activities: [] }
                  )}
                  className={cn(
                    'flex w-[280px] shrink-0 flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 transition-colors',
                    isTarget && 'border-primary/40 bg-primary/5 ring-2 ring-primary/30'
                  )}
                >
                  <header>
                    <div className='flex items-center justify-between gap-2'>
                      <h3 className='text-sm font-semibold tracking-wide'>
                        {quadrant.title}
                      </h3>
                      <Badge
                        variant='secondary'
                        className='shrink-0 tabular-nums'
                      >
                        {list.length}
                      </Badge>
                    </div>
                    <p className='text-[11px] text-muted-foreground'>
                      {quadrant.hint}
                    </p>
                  </header>

                  <div className='flex min-h-16 flex-col gap-2'>
                    {list.map(renderCard)}

                    {list.length === 0 && (
                      <div className='flex h-16 items-center justify-center rounded-lg border border-dashed text-[11px] text-muted-foreground'>
                        Belum ada aktivitas
                      </div>
                    )}
                  </div>

                  <Button
                    variant='ghost'
                    size='sm'
                    className='justify-start gap-1 text-xs'
                    onClick={() => {
                      setDefaultDate(new Date())
                      setDefaultQuadrant(quadrant.id)
                      setOpen('create')
                    }}
                  >
                    <Plus className='h-3.5 w-3.5' />
                    Tambah
                  </Button>
                </section>
              )
            })}
          </div>
        )}

        <Collapsible open={showDone} onOpenChange={setShowDone}>
          <CollapsibleTrigger asChild>
            <Button
              variant='outline'
              className='w-full justify-between'
              aria-expanded={showDone}
            >
              <span className='flex items-center gap-2 font-semibold'>
                <CheckCheck className='h-4 w-4 text-emerald-500' />
                Selesai
                <Badge variant='secondary' className='tabular-nums'>
                  {done.length}
                </Badge>
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  showDone && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className='mt-3'>
              {done.length === 0 ? (
                <p className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
                  Belum ada aktivitas selesai.
                </p>
              ) : (
                <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-3'>
                  {done.map(renderCard)}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Main>

      <ActivitiesDialogs />
    </>
  )
}

export function BoardPage() {
  return (
    <ActivitiesProvider>
      <BoardContent />
    </ActivitiesProvider>
  )
}
