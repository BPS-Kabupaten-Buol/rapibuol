import { useNavigate } from '@tanstack/react-router'
import { type Row } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TeamWithLeader } from '../data/schema'
import { useTeamDialog } from './teams-provider'

interface DataTableRowActionsProps {
  row: Row<TeamWithLeader>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const navigate = useNavigate()
  const { setSelectedTeam, onEditDialogOpen, onDeleteDialogOpen } =
    useTeamDialog()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
          <span className='sr-only'>Open menu</span>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          onClick={() => {
            navigate({ to: `/teams/${row.original.id}` })
          }}
        >
          <Users className='mr-2 h-4 w-4' />
          View Members
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setSelectedTeam(row.original)
            onEditDialogOpen(true)
          }}
        >
          <Pencil className='mr-2 h-4 w-4' />
          Edit Team
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setSelectedTeam(row.original)
            onDeleteDialogOpen(true)
          }}
          className='text-red-600'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Delete Team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
