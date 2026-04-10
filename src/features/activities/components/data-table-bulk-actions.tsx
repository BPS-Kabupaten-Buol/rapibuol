import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, CircleArrowUp, Download } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { statuses } from '../data/data'
import { type Activity } from '../data/schema'
import { ActivitiesMultiDeleteDialog } from './activities-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: boolean) => {
    const selectedActivities = selectedRows.map(
      (row) => row.original as Activity
    )
    toast.promise(sleep(2000), {
      loading: 'Memperbarui status...',
      success: () => {
        table.resetRowSelection()
        return `Status berhasil diperbarui menjadi "${status ? 'Selesai' : 'Belum Selesai'}" untuk ${selectedActivities.length} aktivitas.`
      },
      error: 'Error',
    })
    table.resetRowSelection()
  }

  const handleBulkExport = () => {
    const selectedActivities = selectedRows.map(
      (row) => row.original as Activity
    )
    toast.promise(sleep(2000), {
      loading: 'Mengekspor aktivitas...',
      success: () => {
        table.resetRowSelection()
        return `${selectedActivities.length} aktivitas berhasil diekspor ke CSV.`
      },
      error: 'Error',
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='activity'>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  aria-label='Perbarui status'
                  title='Perbarui status'
                >
                  <CircleArrowUp />
                  <span className='sr-only'>Perbarui status</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Perbarui status</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {statuses.map((status) => (
              <DropdownMenuItem
                key={String(status.value)}
                onClick={() => handleBulkStatusChange(status.value)}
              >
                {status.icon && (
                  <status.icon className='size-4 text-muted-foreground' />
                )}
                {status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkExport()}
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
