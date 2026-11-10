import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { CalendarPlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { activitySchema } from '../data/schema'
import { getActivityCalendarUrl } from '../lib/google-calendar-link'
import { useActivities } from './activities-provider'

type DataTableRowActionsProps<TData> = {
  row: Row<TData>
  unitName?: string | null
  teamName?: string | null
}

export function DataTableRowActions<TData>({
  row,
  unitName,
  teamName,
}: DataTableRowActionsProps<TData>) {
  const activity = activitySchema.parse(row.original)
  const calendarUrl = getActivityCalendarUrl(activity, { unitName, teamName })

  const { setOpen, setCurrentRow } = useActivities()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Buka menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[220px]'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(activity)
            setOpen('update')
          }}
        >
          Ubah
        </DropdownMenuItem>
        {calendarUrl && (
          <DropdownMenuItem asChild>
            <a
              href={calendarUrl}
              target='_blank'
              rel='noopener noreferrer'
              onClick={(event) => event.stopPropagation()}
            >
              <CalendarPlus className='mr-2 h-4 w-4 text-blue-500' />
              Tambah ke Google Calendar
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(activity)
            setOpen('delete')
          }}
        >
          Hapus
          <DropdownMenuShortcut>
            <Trash2 size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
