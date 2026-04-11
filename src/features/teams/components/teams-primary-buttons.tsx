import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTeamDialog } from './teams-provider'

export function TeamsPrimaryButtons() {
  const { onCreateOpen } = useTeamDialog()

  return (
    <div className='flex gap-2'>
      <Button onClick={() => onCreateOpen(true)} size='sm'>
        <Plus className='mr-2 h-4 w-4' />
        Tambah Tim
      </Button>
    </div>
  )
}
