import { format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { type Team } from '@/features/teams/api/teams'
import { type Unit } from '@/features/units/api/units'
import { statuses } from '../data/data'
import { type Task } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const tasksColumns = (
  teams: Team[],
  units: Unit[]
): ColumnDef<Task>[] => [
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
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Deskripsi' />
    ),
    meta: {
      className: 'ps-1 min-w-[200px]',
      tdClassName: 'ps-4',
    },
    cell: ({ row }) => {
      return (
        <div className='flex space-x-2'>
          <span className='truncate font-medium'>
            {row.getValue('description')}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tanggal' />
    ),
    meta: {
      className: 'w-[140px]',
    },
    cell: ({ row }) => {
      const dateVal = row.getValue('date')
      return (
        <div>{dateVal ? format(new Date(dateVal as string), 'PPP') : '-'}</div>
      )
    },
  },
  {
    accessorKey: 'volume',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Volume' />
    ),
    meta: {
      className: 'w-[100px] text-center',
      thClassName: 'text-center',
    },
    cell: ({ row }) => (
      <div className='text-center'>{row.getValue('volume')}</div>
    ),
  },
  {
    accessorKey: 'unit',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Satuan' />
    ),
    meta: {
      className: 'w-[120px]',
    },
    cell: ({ row }) => {
      const unit = units.find((u) => u.id === row.getValue('unit'))
      return <div>{unit ? unit.name : '-'}</div>
    },
  },
  {
    accessorKey: 'start_time',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Jam Mulai'
        className='w-full justify-center'
      />
    ),
    meta: {
      className: 'w-[100px] text-center',
      thClassName: 'text-center',
    },
    cell: ({ row }) => (
      <div className='text-center'>{row.original.start_time || '-'}</div>
    ),
  },
  {
    accessorKey: 'end_time',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Jam Selesai'
        className='w-full justify-center'
      />
    ),
    meta: {
      className: 'w-[100px] text-center',
      thClassName: 'text-center',
    },
    cell: ({ row }) => (
      <div className='text-center'>{row.original.end_time || '-'}</div>
    ),
  },
  {
    accessorKey: 'assignor',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Pemberi Tugas' />
    ),
    meta: {
      className: 'w-[140px]',
    },
    cell: ({ row }) => {
      const team = teams.find((t) => t.id === row.getValue('assignor'))
      return <div>{team ? team.name : '-'}</div>
    },
  },
  {
    accessorKey: 'is_done',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue('is_done')
      )

      if (!status) return null

      return (
        <div className='flex w-[120px] items-center gap-2'>
          {status.icon && (
            <status.icon
              className={`size-4 ${row.getValue('is_done') ? 'text-green-500' : 'text-yellow-500'}`}
            />
          )}
          <span>{status.label}</span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
