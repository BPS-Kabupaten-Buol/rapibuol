import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Activity } from '../data/schema'
import { useActivities } from './activities-provider'

type ActivityDoneToggleProps = {
  activity: Activity
  className?: string
}

/** Checkbox bulat untuk menandai aktivitas selesai/belum selesai. */
export function ActivityDoneToggle({
  activity,
  className,
}: ActivityDoneToggleProps) {
  const { toggleDone } = useActivities()

  const label = activity.is_done
    ? 'Tandai belum selesai'
    : 'Tandai selesai'

  return (
    <button
      type='button'
      role='checkbox'
      aria-checked={activity.is_done}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation()
        toggleDone(activity)
      }}
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
        activity.is_done
          ? 'border-emerald-500 bg-emerald-500 text-white hover:border-emerald-600 hover:bg-emerald-600'
          : 'border-muted-foreground/35 text-transparent hover:border-emerald-500 hover:text-emerald-500/50',
        className
      )}
    >
      <Check className='size-3' strokeWidth={3} aria-hidden='true' />
    </button>
  )
}
