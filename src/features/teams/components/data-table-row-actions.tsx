import { Delete, Edit, Plus } from 'lucide-react'
import { Button, ButtonVariant } from '@/components/ui/button'
import type { Team } from '../data/schema'
import { useTeams } from './hooks'

interface DataTableRowActionsProps<TData> {
  getToggleAllPageRowsSelected: () => void
  getIsSomePageRowsSelected: () => boolean
  getIsAllPageRowsSelected: () => boolean
  toggleAllPageRowsSelected: (value: boolean) => void
  prepareUpdateOptimistic: (row: TData, updater: (old: TData) => TData) => void
  prepareDeleteOptimistic: (row: TData) => void
  undo: () => void
}

export function DataTableRowActions<TData extends Team>({
  getToggleAllPageRowsSelected,
  getIsSomePageRowsSelected,
  getIsAllPageRowsSelected,
  toggleAllPageRowsSelected,
  prepareUpdateOptimistic,
  prepareDeleteOptimistic,
  undo,
}: DataTableRowActionsProps<TData>) {
  const { mutateAsync: deleteTeam } = useTeams()

  const handleDelete = async (original: Team) => {
    await deleteTeam(original.id)
  }

  return (
    <div className='flex items-center gap-2'>
      <Button
        variant='outline'
        size='icon'
        aria-label='Select all'
        onClick={() => toggleAllPageRowsSelected(!getIsAllPageRowsSelected())}
        disabled={!getIsSomePageRowsSelected() && !getIsAllPageRowsSelected()}
        className='translate-y-[2px]'
      >
        {getIsAllPageRowsSelected() ? (
          <Plus />
        ) : getIsSomePageRowsSelected() ? (
          <Edit />
        ) : (
          <Plus />
        )}
      </Button>
      <Button
        variant='outline'
        size='icon'
        onClick={() => {
          prepareUpdateOptimistic({} as Team, () => {
            return {} as Team
          })
        }}
      >
        <Edit />
      </Button>
      <Button
        variant='outline'
        size='icon'
        onClick={() => {
          prepareDeleteOptimistic({} as Team)
          handleDelete({} as Team)
        }}
      >
        <Delete />
      </Button>
    </div>
  )
}
