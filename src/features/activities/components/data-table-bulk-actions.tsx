import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { Check, Circle, CalendarPlus, Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type Team } from '@/features/teams/api/teams'
import { type Unit } from '@/features/units/api/units'
import { updateActivitiesStatus } from '../api/activities'
import { type Activity } from '../data/schema'
import { exportActivities } from '../lib/export-activities'
import { downloadActivitiesIcs } from '../lib/ics-export'
import { ActivitiesMultiDeleteDialog } from './activities-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
  teams: Team[]
  units: Unit[]
}

export function DataTableBulkActions<TData>({
  table,
  teams,
  units,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const queryClient = useQueryClient()

  const selectedActivities = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original as Activity)
  const selectedIds = selectedActivities.map((activity) => activity.id)

  const statusMutation = useMutation({
    mutationFn: (isDone: boolean) => updateActivitiesStatus(selectedIds, isDone),
    onSuccess: (_data, isDone) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success(
        `Status ${selectedActivities.length} aktivitas diubah menjadi "${isDone ? 'Selesai' : 'Belum Selesai'}".`
      )
      table.resetRowSelection()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const handleBulkCalendar = () => {
    if (selectedActivities.length === 0) return

    try {
      downloadActivitiesIcs(selectedActivities, teams, units)
      toast.success(
        `${selectedActivities.length} aktivitas diekspor ke file .ics. Buka file itu untuk mengimpor ke Google Calendar.`,
        { duration: 8000 }
      )
      table.resetRowSelection()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleBulkExport = () => {
    if (selectedActivities.length === 0) return

    try {
      exportActivities(selectedActivities, teams, units, '-terpilih')
      toast.success(`${selectedActivities.length} aktivitas diekspor ke XLSX.`)
      table.resetRowSelection()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='activity'>
        <Button
          size='sm'
          className='h-8 gap-1.5'
          disabled={statusMutation.isPending}
          onClick={() => statusMutation.mutate(true)}
          aria-label='Tandai selesai'
          title='Tandai selesai'
        >
          <Check className='size-4' />
          <span className='max-sm:sr-only'>Tandai selesai</span>
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              className='size-8'
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(false)}
              aria-label='Tandai belum selesai'
              title='Tandai belum selesai'
            >
              <Circle />
              <span className='sr-only'>Tandai belum selesai</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tandai belum selesai</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBulkExport}
              className='size-8'
              aria-label='Ekspor aktivitas'
              title='Ekspor aktivitas'
            >
              <Download />
              <span className='sr-only'>Ekspor aktivitas</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ekspor aktivitas</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBulkCalendar}
              className='size-8'
              aria-label='Tambah ke Google Calendar'
              title='Tambah ke Google Calendar'
            >
              <CalendarPlus />
              <span className='sr-only'>Tambah ke Google Calendar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tambah ke Google Calendar</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Hapus aktivitas yang dipilih'
              title='Hapus aktivitas yang dipilih'
            >
              <Trash2 />
              <span className='sr-only'>Hapus aktivitas yang dipilih</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Hapus aktivitas yang dipilih</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <ActivitiesMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
      />
    </>
  )
}
