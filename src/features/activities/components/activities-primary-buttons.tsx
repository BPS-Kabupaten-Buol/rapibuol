import { Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useActivities } from './activities-provider'

export function ActivitiesPrimaryButtons() {
  const { setOpen } = useActivities()
  return (
    <div className='flex min-w-0 gap-2'>
      <Button
        variant='outline'
        className='min-w-0 shrink-0 gap-1'
        onClick={() => setOpen('import')}
      >
        <Upload size={16} />
        <span className='max-sm:hidden'>Impor</span>
      </Button>
      <Button
        className='min-w-0 shrink-0 gap-1'
        onClick={() => setOpen('create')}
      >
        <Plus size={16} />
        <span className='max-sm:hidden'>Buat</span>
      </Button>
    </div>
  )
}
