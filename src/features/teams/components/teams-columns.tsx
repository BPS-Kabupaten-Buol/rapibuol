import { type ColumnDef } from '@tanstack/react-table'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { TeamWithLeader } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'
import { useTeamDialog } from './teams-provider'

export const teamsColumns: ColumnDef<TeamWithLeader>[] = [
  {
    accessorKey: 'name',
    header: 'Nama Tim',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
          <Users className='h-4 w-4 text-primary' />
        </div>
        <span className='font-medium'>{row.getValue('name')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'leader_name',
    header: 'Ketua Tim',
    cell: ({ row }) => {
      const leaderName = row.getValue('leader_name') as string | null
      const leaderEmail = row.original.leader_email
      return (
        <div className='flex flex-col'>
          <span className='text-sm font-medium'>
            {leaderName || 'Tidak Ada'}
          </span>
          {leaderEmail && (
            <span className='text-xs text-muted-foreground'>{leaderEmail}</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'member_count',
    header: 'Anggota',
    cell: ({ row }) => {
      const count = row.getValue('member_count') as number
      const { setSelectedTeam, onMembersOpen } = useTeamDialog()

      return (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setSelectedTeam(row.original)
            onMembersOpen(true)
          }}
          className='flex items-center transition-opacity hover:opacity-70'
        >
          <Badge variant='outline' className='cursor-pointer'>
            {count} anggota
          </Badge>
        </button>
      )
    },
  },
  // {
  //   accessorKey: 'created_at',
  //   header: 'Created',
  //   cell: ({ row }) => {
  //     const date = row.getValue('created_at') as Date
  //     return <span className='text-sm'>{date.toLocaleDateString()}</span>
  //   },
  // },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
