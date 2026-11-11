import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ActivityDoneToggle } from '@/features/activities/components/activity-done-toggle'
import { type Activity } from '@/features/activities/data/schema'
import { formatActivityTime } from '@/features/activities/lib/activity-time'

type DayAgendaProps = {
  activities: Activity[]
  onSelectActivity: (activity: Activity) => void
  onCreate: () => void
}

/** Daftar aktivitas satu hari untuk tampilan harian. */
export function DayAgenda({
  activities,
  onSelectActivity,
  onCreate,
}: DayAgendaProps) {
  if (activities.length === 0) {
    return (
      <div className='flex flex-col items-center gap-3 px-4 py-12 text-center'>
        <p className='text-sm text-muted-foreground'>
          Belum ada aktivitas pada hari ini.
        </p>
        <Button size='sm' variant='outline' className='gap-1' onClick={onCreate}>
          <Plus className='h-4 w-4' />
          Tambah Aktivitas
        </Button>
      </div>
    )
  }

  return (
    <ul className='divide-y'>
      {activities.map((activity) => {
        const time = formatActivityTime(activity.start_time, activity.end_time)

        return (
          <li
            key={activity.id}
            className='flex items-start gap-3 px-3 py-3 transition-colors hover:bg-muted/50 sm:px-4'
          >
            <ActivityDoneToggle activity={activity} className='mt-0.5' />

            <button
              type='button'
              className='flex min-w-0 flex-1 items-start gap-3 text-left'
              onClick={() => onSelectActivity(activity)}
            >
              <span className='w-20 shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums'>
                {time ?? '–'}
              </span>

              <span className='min-w-0 flex-1'>
                <span
                  className={cn(
                    'block text-sm font-medium break-words',
                    activity.is_done && 'text-muted-foreground line-through'
                  )}
                >
                  {activity.description}
                </span>

                {activity.end_date && (
                  <span className='mt-0.5 block text-xs text-muted-foreground'>
                    s/d{' '}
                    {new Date(activity.end_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
