import { useMemo } from 'react'
import {
  format,
  subDays,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ActivityHeatmapProps {
  data: Record<string, number> // { "YYYY-MM-DD": count }
  startDate?: Date
  endDate?: Date
}

export function ActivityHeatmap({
  data,
  startDate = subDays(new Date(), 90),
  endDate = new Date(),
}: ActivityHeatmapProps) {
  const CELL_SIZE = 14
  const CELL_GAP = 5

  const { weeks, monthLabels } = useMemo(() => {
    const calendarStart = startOfWeek(startDate, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(endDate, { weekStartsOn: 0 })

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const weeks: Date[][] = []
    let currentWeek: Date[] = []

    days.forEach((day) => {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    })

    const monthLabels: { month: string; colIndex: number }[] = []
    let currentMonth = -1

    weeks.forEach((week, colIndex) => {
      const firstDayOfWeek = week[0]
      const month = firstDayOfWeek.getMonth()
      if (month !== currentMonth && firstDayOfWeek >= startDate) {
        monthLabels.push({
          month: format(firstDayOfWeek, 'MMM'),
          colIndex,
        })
        currentMonth = month
      }
    })

    return { weeks, monthLabels }
  }, [startDate, endDate])

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-muted'
    if (count === 1) return 'bg-green-200 dark:bg-green-900/50'
    if (count >= 2 && count <= 3) return 'bg-green-400 dark:bg-green-700'
    if (count >= 4 && count <= 5) return 'bg-green-600 dark:bg-green-500'
    return 'bg-green-800 dark:bg-green-400'
  }

  const cellPx = `${CELL_SIZE}px`
  const gapPx = `${CELL_GAP}px`

  return (
    <div className='flex w-full flex-col overflow-x-auto pb-2'>
      <div className='min-w-fit'>
        {/* Months header */}
        <div className='mb-2 flex' style={{ position: 'relative', height: '20px' }}>
          <div style={{ width: '32px' }} />
          <div className='relative flex-1'>
            {monthLabels.map((ml, i) => (
              <span
                key={i}
                className='absolute text-xs text-muted-foreground font-medium'
                style={{ left: `${ml.colIndex * (CELL_SIZE + CELL_GAP)}px` }}
              >
                {ml.month}
              </span>
            ))}
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className='flex items-start' style={{ gap: gapPx }}>
          {/* Day Labels */}
          <div
            className='flex flex-col text-[11px] text-muted-foreground'
            style={{ width: '28px', gap: gapPx, paddingTop: '2px' }}
          >
            <span style={{ height: cellPx }} className='hidden' />
            <span style={{ height: cellPx }} className='leading-none flex items-center'>Sen</span>
            <span style={{ height: cellPx }} className='hidden' />
            <span style={{ height: cellPx }} className='leading-none flex items-center'>Rab</span>
            <span style={{ height: cellPx }} className='hidden' />
            <span style={{ height: cellPx }} className='leading-none flex items-center'>Jum</span>
            <span style={{ height: cellPx }} className='hidden' />
          </div>

          <TooltipProvider delayDuration={100}>
            <div className='flex flex-nowrap' style={{ gap: gapPx }}>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className='flex flex-col' style={{ gap: gapPx }}>
                  {week.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const count = data[dateStr] || 0

                    if (day < startDate || day > endDate) {
                      return (
                        <div
                          key={dateStr}
                          style={{ height: cellPx, width: cellPx }}
                          className='rounded-[3px]'
                        />
                      )
                    }

                    return (
                      <Tooltip key={dateStr}>
                        <TooltipTrigger asChild>
                          <div
                            style={{ height: cellPx, width: cellPx }}
                            className={cn(
                              'cursor-pointer rounded-[3px] transition-colors',
                              getIntensityClass(count)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent className='text-xs'>
                          {count === 0
                            ? 'Tidak ada aktivitas'
                            : `${count} aktivitas`}{' '}
                          pada {format(day, 'd MMM yyyy')}
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>

        {/* Legend */}
        <div className='mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground'>
          <span>Sedikit</span>
          <div className='flex gap-1'>
            <div style={{ height: cellPx, width: cellPx }} className='rounded-[3px] bg-muted' />
            <div style={{ height: cellPx, width: cellPx }} className='rounded-[3px] bg-green-200 dark:bg-green-900/50' />
            <div style={{ height: cellPx, width: cellPx }} className='rounded-[3px] bg-green-400 dark:bg-green-700' />
            <div style={{ height: cellPx, width: cellPx }} className='rounded-[3px] bg-green-600 dark:bg-green-500' />
            <div style={{ height: cellPx, width: cellPx }} className='rounded-[3px] bg-green-800 dark:bg-green-400' />
          </div>
          <span>Banyak</span>
        </div>
      </div>
    </div>
  )
}
