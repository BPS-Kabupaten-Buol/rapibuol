import { type ColumnDef } from '@tanstack/react-table'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { type User as UserType } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const usersColumns: ColumnDef<UserType>[] = [
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
      <div className='flex items-center gap-2'>
        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
          <User className='h-4 w-4 text-primary' />
        </div>
        <span className='font-medium text-nowrap'>{row.getValue('name')}</span>
      </div>
    ),
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='w-fit ps-2 text-nowrap'>{row.getValue('email')}</div>
    ),
  },
  {
    accessorKey: 'teams',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tim' />
    ),
    cell: ({ row }) => {
      const teams = row.original.teams
      if (!teams || teams.length === 0) {
        return <span className='text-muted-foreground'>-</span>
      }
      return (
        <div className='flex flex-wrap gap-1'>
          {teams.map((team) => (
            <Badge key={team.id} variant='outline' className='capitalize'>
              {team.name}
            </Badge>
          ))}
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'roles',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Roles' />
    ),
    cell: ({ row }) => {
      const roles = row.original.roles
      if (!roles || roles.length === 0) {
        return <span className='text-muted-foreground'>-</span>
      }
      return (
        <div className='flex flex-wrap gap-1'>
          {roles.map((role) => (
            <Badge key={role.id} variant='secondary' className='capitalize'>
              {role.name}
            </Badge>
          ))}
        </div>
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
