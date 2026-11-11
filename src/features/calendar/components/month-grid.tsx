import { useRef, useState, type DragEvent } from 'react'
import {
  differenceInCalendarDays,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { type Activity } from '@/features/activities/data/schema'
import { buildMonthWeeks, MAX_LANES } from '../lib/build-month-weeks'

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
/** Jumlah label aktivitas yang muat di sel ponsel. */
const MAX_MOBILE_CHIPS = 3
/** Perkiraan tinggi satu label aktivitas di ponsel. */
const MOBILE_CHIP_H = 15

/** Tinggi area tanggal di atas lajur event. */
const DAY_HEADER_H = 32
/** Jarak antar baris event. */
const LANE_H = 22
/** Tinggi bar event itu sendiri. */
const BAR_H = 17

type MonthGridProps = {
  month: Date
  /** Kalau diisi, hanya minggu yang memuat tanggal ini yang ditampilkan. */
  weekOf?: Date | null
  activities: Activity[]
  activitiesByDay: Map<string, Activity[]>
  onSelectDay: (day: Date) => void
  onSelectActivity?: (activity: Activity) => void
  onMoveActivity?: (activity: Activity, deltaDays: number) => void
}

function barLabel(activity: Activity, isMultiDay: boolean): string {
  if (isMultiDay || !activity.start_time) return activity.description
  return `${activity.start_time.slice(0, 5)} ${activity.description}`
}

function barTitle(activity: Activity): string {
  const start = format(parseISO(activity.date), 'd MMM yyyy')

  if (!activity.end_date) return `${activity.description} · ${start}`

  return `${activity.description} · ${start} – ${format(parseISO(activity.end_date), 'd MMM yyyy')}`
}

export function MonthGrid({
  month,
  weekOf,
  activities,
  activitiesByDay,
  onSelectDay,
  onSelectActivity,
  onMoveActivity,
}: MonthGridProps) {
  const weeks = buildMonthWeeks(month, activities, MAX_LANES).filter(
    (week) => !weekOf || week.days.some((day) => isSameDay(day, weekOf))
  )
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [hoverKey, setHoverKey] = useState<string | null>(null)
  const draggingActivity = useRef<Activity | null>(null)
  const draggingStartDay = useRef<Date | null>(null)

  const openActivity = (activity: Activity, day: Date) => {
    if (onSelectActivity) onSelectActivity(activity)
    else onSelectDay(day)
  }

  const resetDrag = () => {
    draggingActivity.current = null
    draggingStartDay.current = null
    setDraggingId(null)
    setHoverKey(null)
  }

  return (
    <div className='w-full overflow-x-auto'>
      {/* Header and body share one width so the columns stay aligned while scrolling. */}
      <div className='min-w-[56rem]'>
        <div className='grid grid-cols-7 border-b text-xs font-medium text-muted-foreground'>
          {WEEKDAYS.map((day) => (
            <div key={day} className='py-2 text-center'>
              {day}
            </div>
          ))}
        </div>

        <div>
          {weeks.map((week, weekIndex) => {
            const hasOverflow = week.overflow.length > 0

            // Di ponsel setiap sel menampilkan teks aktivitas, jadi tingginya
            // ikut menyesuaikan jumlah label yang terlihat.
            const maxMobileChips = week.days.reduce((max, day) => {
              const count =
                activitiesByDay.get(format(day, 'yyyy-MM-dd'))?.length ?? 0
              return Math.max(max, Math.min(count, MAX_MOBILE_CHIPS))
            }, 0)

            const rowHeight = Math.max(
              84,
              DAY_HEADER_H + 6 + maxMobileChips * MOBILE_CHIP_H + 4,
              DAY_HEADER_H + week.laneCount * LANE_H + (hasOverflow ? 16 : 4)
            )

            // Kolom dihitung dari posisi kursor terhadap lebar baris, supaya
            // drop tetap jalan walau kursor berada di atas bar event lain.
            const columnAt = (event: DragEvent<HTMLDivElement>) => {
              const rect = event.currentTarget.getBoundingClientRect()
              if (rect.width === 0) return 0

              const ratio = (event.clientX - rect.left) / rect.width
              return Math.min(6, Math.max(0, Math.floor(ratio * 7)))
            }

            const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
              if (draggingId === null) return

              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'

              const key = format(week.days[columnAt(event)], 'yyyy-MM-dd')
              if (hoverKey !== key) setHoverKey(key)
            }

            const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
              const next = event.relatedTarget as Node | null
              if (next && event.currentTarget.contains(next)) return
              setHoverKey(null)
            }

            const handleDrop = (event: DragEvent<HTMLDivElement>) => {
              const activity = draggingActivity.current
              const startDay = draggingStartDay.current
              if (!activity || !startDay) return

              event.preventDefault()

              const day = week.days[columnAt(event)]
              const deltaDays = differenceInCalendarDays(day, startDay)
              resetDrag()

              if (deltaDays !== 0) onMoveActivity?.(activity, deltaDays)
            }

            return (
              <div
                key={weekIndex}
                className='relative'
                style={{ minHeight: rowHeight }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className='absolute inset-0 grid grid-cols-7'>
                  {week.days.map((day, dayIndex) => {
                    const key = format(day, 'yyyy-MM-dd')
                    const dayActivities = activitiesByDay.get(key) ?? []
                    // Tampilan minggu bisa memuat tanggal dari bulan sebelah.
                    const inMonth = weekOf ? true : isSameMonth(day, month)
                    const isDropTarget = hoverKey === key && draggingId !== null

                    return (
                      <button
                        type='button'
                        key={key}
                        onClick={() => onSelectDay(day)}
                        aria-label={day.toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        className={cn(
                          'flex min-w-0 flex-col items-start gap-1 border-r border-b p-1.5 text-left transition-colors',
                          'hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none',
                          dayIndex === 6 && 'border-r-0',
                          !inMonth && 'opacity-60',
                          isDropTarget &&
                            'bg-primary/5 ring-2 ring-primary/40 ring-inset'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums',
                            isToday(day) && 'bg-primary text-primary-foreground'
                          )}
                        >
                          {format(day, 'd')}
                        </span>

                        {/* Teks aktivitas di ponsel; bar di layar lebar. */}
                        <div className='flex w-full min-w-0 flex-col gap-0.5 sm:hidden'>
                          {dayActivities
                            .slice(0, MAX_MOBILE_CHIPS)
                            .map((activity) => (
                              <span
                                key={activity.id}
                                className='flex w-full min-w-0 items-start gap-1 text-[10px] leading-tight'
                              >
                                <span
                                  className={cn(
                                    'mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full',
                                    activity.is_done
                                      ? 'bg-emerald-500'
                                      : 'bg-amber-500'
                                  )}
                                />
                                <span
                                  className={cn(
                                    'min-w-0 flex-1 truncate',
                                    activity.is_done &&
                                      'text-muted-foreground line-through'
                                  )}
                                >
                                  {activity.description}
                                </span>
                              </span>
                            ))}

                          {dayActivities.length > MAX_MOBILE_CHIPS && (
                            <span className='text-[10px] text-muted-foreground'>
                              +{dayActivities.length - MAX_MOBILE_CHIPS} lagi
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className='pointer-events-none absolute inset-0 z-10 hidden sm:block'>
                  {week.bars.map((bar) => (
                    <div
                      key={`${bar.activity.id}-${bar.lane}`}
                      role='button'
                      tabIndex={0}
                      draggable={!!onMoveActivity}
                      onDragStart={(event) => {
                        draggingActivity.current = bar.activity
                        draggingStartDay.current = week.days[bar.startCol]
                        setDraggingId(bar.activity.id)
                        event.dataTransfer.effectAllowed = 'move'
                        try {
                          event.dataTransfer.setData(
                            'text/plain',
                            String(bar.activity.id)
                          )
                        } catch {
                          /* sebagian browser membatasi dataTransfer */
                        }
                      }}
                      onDragEnd={resetDrag}
                      onClick={() =>
                        openActivity(bar.activity, week.days[bar.startCol])
                      }
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return

                        event.preventDefault()
                        openActivity(bar.activity, week.days[bar.startCol])
                      }}
                      title={barTitle(bar.activity)}
                      aria-label={barTitle(bar.activity)}
                      className={cn(
                        'pointer-events-auto absolute flex items-center gap-1 overflow-hidden px-1.5 text-left text-[11px] leading-none transition-colors select-none',
                        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                        onMoveActivity && 'cursor-grab active:cursor-grabbing',
                        bar.continuesBefore ? 'rounded-l-none' : 'rounded-l-md',
                        bar.continuesAfter ? 'rounded-r-none' : 'rounded-r-md',
                        bar.activity.is_done
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300',
                        draggingId === bar.activity.id && 'opacity-40'
                      )}
                      style={{
                        left: `${(bar.startCol / 7) * 100}%`,
                        width: `${((bar.endCol - bar.startCol + 1) / 7) * 100}%`,
                        top: DAY_HEADER_H + bar.lane * LANE_H,
                        height: BAR_H,
                      }}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 shrink-0 rounded-full',
                          bar.activity.is_done
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        )}
                      />
                      <span className='min-w-0 flex-1 truncate'>
                        {barLabel(bar.activity, bar.isMultiDay)}
                      </span>
                    </div>
                  ))}

                  {week.overflow.map((note) => (
                    <span
                      key={note.col}
                      className='absolute truncate px-1.5 text-[11px] text-muted-foreground'
                      style={{
                        left: `${(note.col / 7) * 100}%`,
                        width: `${100 / 7}%`,
                        top: DAY_HEADER_H + week.laneCount * LANE_H,
                      }}
                    >
                      +{note.count} lagi
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
