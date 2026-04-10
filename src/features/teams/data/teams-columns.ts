import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import type { Team } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const teamsColumns: ColumnDef<Team>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    meta: {
      className: cn('max-md:sticky start-0 z-10 rounded-tl-[inherit]'),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <div className='w-fit ps-2 text-nowrap'>{row.getValue('name')}</div>
    ),
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'leader',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Leader' />
    ),
    cell: ({ row }) => {
      const leaderId = row.getValue('leader')
      if (!leaderId) return <span className='text-muted-foreground'>-</span>
      
      // In a real app, we would fetch the user name from the leaderId
      // For now, we'll show the UUID or a placeholder
      return (
        <span className='text-sm'>
          {leaderId.length > 8 ? `${leaderId.substring(0, 8)}...` : leaderId}
        </span>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ row }) => {
      const date = row.getValue('createdAt')
      if (!date) return <span className='text-muted-foreground'>-</span>
      return (
        <span className='text-xs'>
          {new Date(date).toLocaleDateString()}
        </span>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]