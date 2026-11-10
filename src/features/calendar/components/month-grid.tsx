import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { type Activity } from '@/features/activities/data/schema'

const WEEK_STARTS_ON = 1
const MAX_CHIPS = 3
const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

type MonthGridProps = {
  month: Date
  activitiesByDay: Map<string, Activity[]>
  onSelectDay: (day: Date) => void
}

export function MonthGrid({
  month,
  activitiesByDay,
  onSelectDay,
}: MonthGridProps) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: WEEK_STARTS_ON }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: WEEK_STARTS_ON }),
  })

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

        <div className='grid grid-cols-7'>
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const dayActivities = activitiesByDay.get(key) ?? []
            const visible = dayActivities.slice(0, MAX_CHIPS)
            const hiddenCount = dayActivities.length - visible.length
            const inMonth = isSameMonth(day, month)

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
                  'flex min-h-20 min-w-0 flex-col gap-1 border-r border-b p-1.5 text-left transition-colors',
                  'hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none',
                  'sm:min-h-28 sm:p-2',
                  '[&:nth-child(7n)]:border-r-0',
                  !inMonth && 'opacity-60'
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

                {/* Event list on sm and wider */}
                <div className='hidden w-full min-w-0 flex-col gap-0.5 sm:flex'>
                  {visible.map((activity) => (
                    <span
                      key={activity.id}
                      className='flex w-full min-w-0 items-start gap-1 text-[11px] leading-tight'
                    >
                      <span
                        className={cn(
                          'mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full',
                          activity.is_done ? 'bg-emerald-500' : 'bg-amber-500'
                        )}
                      />
                      <span className='min-w-0 flex-1 break-words'>
                        {activity.start_time && (
                          <span className='text-muted-foreground tabular-nums'>
                            {activity.start_time.slice(0, 5)}{' '}
                          </span>
                        )}
                        {activity.description}
                      </span>
                    </span>
                  ))}

                  {hiddenCount > 0 && (
                    <span className='text-[11px] text-muted-foreground'>
                      +{hiddenCount} lagi
                    </span>
                  )}
                </div>

                {/* Dots on phones */}
                <div className='flex flex-wrap items-center gap-0.5 sm:hidden'>
                  {visible.map((activity) => (
                    <span
                      key={activity.id}
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        activity.is_done ? 'bg-emerald-500' : 'bg-amber-500'
                      )}
                    />
                  ))}
                  {hiddenCount > 0 && (
                    <span className='text-[10px] text-muted-foreground'>
                      +{hiddenCount}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
