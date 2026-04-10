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
  startDate = subDays(new Date(), 364), // Last 364 days to make ~52 exact weeks
  endDate = new Date(),
}: ActivityHeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => {
    // For heatmap, force the grid to start on Sunday of the first week
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
      // Only show month label if it's a new month and we're not at the very beginning (unless explicit)
      // to avoid overlapping month labels.
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

  return (
    <div className='flex w-full flex-col overflow-x-auto pb-4'>
      <div className='min-w-fit px-4'>
        {/* Months header */}
        <div
          className='mb-2 flex'
          style={{ position: 'relative', height: '20px' }}
        >
          <div className='w-[30px]' /> {/* Space for day labels */}
          <div className='relative flex-1'>
            {monthLabels.map((ml, i) => (
              <span
                key={i}
                className='absolute text-xs text-muted-foreground'
                style={{ left: `${ml.colIndex * 15}px`, width: '15px' }}
              >
                {ml.month}
              </span>
            ))}
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className='flex items-start gap-1'>
          {/* Day Labels - only show Mon, Wed, Fri */}
          <div className='mt-0 flex w-[30px] flex-col gap-[4px] pt-1 text-[10px] text-muted-foreground'>
            <span className='hidden h-[10px]' /> {/* Sun */}
            <span className='h-[10px] leading-[10px]'>Sen</span> {/* Mon */}
            <span className='hidden h-[10px]' /> {/* Tue */}
            <span className='h-[10px] leading-[10px]'>Rab</span> {/* Wed */}
            <span className='hidden h-[10px]' /> {/* Thu */}
            <span className='h-[10px] leading-[10px]'>Jum</span> {/* Fri */}
            <span className='hidden h-[10px]' /> {/* Sat */}
          </div>

          <TooltipProvider delayDuration={100}>
            <div className='flex flex-nowrap gap-[4px]'>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className='flex flex-col gap-[4px]'>
                  {week.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const count = data[dateStr] || 0

                    // Don't show boxes before start date or after end date
                    if (day < startDate || day > endDate) {
                      return (
                        <div
                          key={dateStr}
                          className='h-[10px] w-[10px] rounded-[2px]'
                        />
                      )
                    }

                    return (
                      <Tooltip key={dateStr}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'h-[10px] w-[10px] cursor-pointer rounded-[2px] transition-colors',
                              getIntensityClass(count)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent className='text-xs'>
                          {count === 0
                            ? 'Tidak ada aktivitas'
                            : `${count} aktivitas`}{' '}
                          pada {format(day, 'MMM d, yyyy')}
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
          <span>Lebih Sedikit</span>
          <div className='flex gap-1'>
            <div className='h-[10px] w-[10px] rounded-[2px] bg-muted' />
            <div className='h-[10px] w-[10px] rounded-[2px] bg-green-200 dark:bg-green-900/50' />
            <div className='h-[10px] w-[10px] rounded-[2px] bg-green-400 dark:bg-green-700' />
            <div className='h-[10px] w-[10px] rounded-[2px] bg-green-600 dark:bg-green-500' />
            <div className='h-[10px] w-[10px] rounded-[2px] bg-green-800 dark:bg-green-400' />
          </div>
          <span>Lebih Banyak</span>
        </div>
      </div>
    </div>
  )
}
