import { useMemo, useState, type DragEvent } from 'react'
import { format, parseISO } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { id as localeId } from 'date-fns/locale'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  Clock,
  Ellipsis,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { NotificationBell } from '@/components/notification-bell'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { getActivities } from '@/features/activities/api/activities'
import { ActivitiesDialogs } from '@/features/activities/components/activities-dialogs'
import { ActivitiesPrimaryButtons } from '@/features/activities/components/activities-primary-buttons'
import {
  ActivitiesProvider,
  useActivities,
} from '@/features/activities/components/activities-provider'
import { ActivityDoneToggle } from '@/features/activities/components/activity-done-toggle'
import {
  type Activity,
  type ActivityQuadrant,
} from '@/features/activities/data/schema'
import { useUpdateBoardCard } from './hooks/use-update-board-card'
import { moveBoardCard, parseBoardCardOrder } from './lib/card-order'
import {
  BOARD_QUADRANTS,
  groupActivitiesIntoQuadrants,
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
  onDragOver,
  disabled,
  onMoveUp,
  onMoveDown,
  onMoveTo,
}: {
  activity: Activity
  isDragging: boolean
  onDragStart: (event: DragEvent<HTMLDivElement>) => void
  onDragEnd: () => void
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void
  disabled: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  onMoveTo: (quadrant: ActivityQuadrant) => void
}) {
  const { setDetailActivity } = useActivities()

  return (
    <div
      draggable={!disabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      className={cn(
        'cursor-grab rounded-lg border bg-card p-3 shadow-sm transition active:cursor-grabbing',
        'focus-within:ring-2 focus-within:ring-ring',
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='size-11 shrink-0'
              disabled={disabled}
              aria-label={`Pindahkan aktivitas: ${activity.description}`}
            >
              <Ellipsis className='size-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem disabled={!onMoveUp} onClick={onMoveUp}>
              <ArrowUp /> Geser ke atas
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!onMoveDown} onClick={onMoveDown}>
              <ArrowDown /> Geser ke bawah
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Pindahkan ke</DropdownMenuLabel>
            {BOARD_QUADRANTS.map((quadrant) => (
              <DropdownMenuItem
                key={quadrant.id}
                disabled={
                  !activity.is_done &&
                  (activity.quadrant ?? 'do-first') === quadrant.id
                }
                onClick={() => onMoveTo(quadrant.id)}
              >
                {quadrant.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function BoardContent() {
  const { user } = useAuth()
  const { setOpen, setDefaultDate, setDefaultQuadrant } = useActivities()
  const updateCard = useUpdateBoardCard()
  const [dragging, setDragging] = useState<Activity | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    quadrant: ActivityQuadrant
    beforeId: number | null
  } | null>(null)
  const orderKey = user?.id ? `board-card-order:${user.id}` : null
  const [cardOrder, setCardOrder] = useState<number[]>(() => {
    try {
      return parseBoardCardOrder(
        orderKey ? localStorage.getItem(orderKey) : null
      )
    } catch {
      return []
    }
  })
  const [showDone, setShowDone] = useState(false)

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', user?.id],
    queryFn: () => getActivities(user?.id),
    enabled: !!user?.id,
  })

  const { columns, done } = useMemo(
    () => groupActivitiesIntoQuadrants(activities, cardOrder),
    [activities, cardOrder]
  )

  const resetDrag = () => {
    setDragging(null)
    setDropTarget(null)
  }

  const moveCard = async (
    activity: Activity,
    quadrant: ActivityQuadrant,
    beforeId: number | null
  ) => {
    if (updateCard.isPending) return

    const previousOrder = cardOrder
    const changesColumn =
      activity.is_done || (activity.quadrant ?? 'do-first') !== quadrant
    const nextOrder = moveBoardCard(
      columns.flatMap((column) => column.activities.map((item) => item.id)),
      activity.id,
      beforeId
    )
    setCardOrder(nextOrder)

    try {
      if (changesColumn) {
        await updateCard.mutateAsync({
          activity,
          quadrant,
          ...(activity.is_done ? { isDone: false } : {}),
        })
      }
    } catch {
      setCardOrder(previousOrder)
      return
    }

    try {
      if (orderKey) localStorage.setItem(orderKey, JSON.stringify(nextOrder))
    } catch {
      toast.error(
        'Urutan hanya tersimpan sementara karena penyimpanan browser tidak tersedia.'
      )
      return
    }
    if (!changesColumn) toast.success('Urutan aktivitas diperbarui.')
  }

  const dropOnQuadrant =
    (quadrant: BoardQuadrant) => (event: DragEvent<HTMLElement>) => {
      event.preventDefault()

      const activity = dragging
      const beforeId =
        dropTarget?.quadrant === quadrant.id ? dropTarget.beforeId : null
      resetDrag()
      if (!activity || beforeId === activity.id) return

      void moveCard(activity, quadrant.id, beforeId)
    }

  const renderCard = (
    activity: Activity,
    quadrant?: BoardQuadrant,
    list: Activity[] = []
  ) => {
    const index = list.findIndex((item) => item.id === activity.id)
    return (
      <BoardCard
        key={activity.id}
        activity={activity}
        isDragging={dragging?.id === activity.id}
        disabled={updateCard.isPending}
        onMoveUp={
          quadrant && index > 0
            ? () => void moveCard(activity, quadrant.id, list[index - 1].id)
            : undefined
        }
        onMoveDown={
          quadrant && index >= 0 && index < list.length - 1
            ? () =>
                void moveCard(
                  activity,
                  quadrant.id,
                  list[index + 2]?.id ?? null
                )
            : undefined
        }
        onMoveTo={(target) => void moveCard(activity, target, null)}
        onDragOver={
          quadrant
            ? (event) => {
                if (!dragging || updateCard.isPending) return
                event.preventDefault()
                event.stopPropagation()
                event.dataTransfer.dropEffect = 'move'
                if (dragging.id === activity.id) {
                  setDropTarget({
                    quadrant: quadrant.id,
                    beforeId: activity.id,
                  })
                  return
                }
                const bounds = event.currentTarget.getBoundingClientRect()
                const remaining = list.filter((item) => item.id !== dragging.id)
                const targetIndex = remaining.findIndex(
                  (item) => item.id === activity.id
                )
                const beforeId =
                  event.clientY < bounds.top + bounds.height / 2
                    ? activity.id
                    : (remaining[targetIndex + 1]?.id ?? null)
                setDropTarget({ quadrant: quadrant.id, beforeId })
              }
            : undefined
        }
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
  }

  const quadrantProps = (quadrant: BoardQuadrant) => ({
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!dragging || updateCard.isPending) return

      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      setDropTarget({ quadrant: quadrant.id, beforeId: null })
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      const next = event.relatedTarget as Node | null
      if (next && event.currentTarget.contains(next)) return
      if (dropTarget?.quadrant === quadrant.id) setDropTarget(null)
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
              const isTarget =
                dragging !== null && dropTarget?.quadrant === quadrant.id

              return (
                <section
                  key={quadrant.id}
                  {...quadrantProps(quadrant)}
                  onDrop={dropOnQuadrant(quadrant)}
                  className={cn(
                    'flex w-[280px] shrink-0 flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 transition-colors',
                    isTarget &&
                      'border-primary/40 bg-primary/5 ring-2 ring-primary/30'
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
                    {list.map((activity) => (
                      <div key={activity.id} className='relative'>
                        {isTarget && dropTarget.beforeId === activity.id && (
                          <div
                            aria-hidden='true'
                            className='absolute inset-x-0 -top-1.5 h-1 rounded bg-primary'
                          />
                        )}
                        {renderCard(activity, quadrant, list)}
                      </div>
                    ))}
                    {isTarget && dropTarget.beforeId === null && (
                      <div
                        aria-hidden='true'
                        className='h-1 rounded bg-primary'
                      />
                    )}

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
                  {done.map((activity) => renderCard(activity))}
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
