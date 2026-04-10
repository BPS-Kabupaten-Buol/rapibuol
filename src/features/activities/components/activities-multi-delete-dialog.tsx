'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteActivities } from '../api/activities'
import { type Activity } from '../data/schema'

type ActivityMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

const CONFIRM_WORD = 'DELETE'

export function ActivitiesMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: ActivityMultiDeleteDialogProps<TData>) {
  const [value, setValue] = useState('')
  const queryClient = useQueryClient()

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedIds = selectedRows.map((row) => (row.original as Activity).id)

  const deleteMutation = useMutation({
    mutationFn: deleteActivities,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success(
        `${selectedIds.length} aktivitas${selectedIds.length > 1 ? '' : ''} berhasil dihapus`
      )
      setValue('')
      table.resetRowSelection()
    },
    onError: () => {
      toast.error('Gagal menghapus aktivitas')
    },
  })

  const handleDelete = () => {
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`Silakan ketik "${CONFIRM_WORD}" untuk mengonfirmasi.`)
      return
    }

    deleteMutation.mutate(selectedIds)
    onOpenChange(false)
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== CONFIRM_WORD}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Hapus {selectedRows.length}{' '}
          {selectedRows.length > 1 ? 'aktivitas' : 'aktivitas'}
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Apakah Anda yakin ingin menghapus aktivitas yang dipilih? <br />
            Tindakan ini tidak dapat dibatalkan.
          </p>

          <Label className='my-4 flex flex-col items-start gap-1.5'>
            <span className=''>
              Konfirmasi dengan mengetik "{CONFIRM_WORD}":
            </span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Ketik "${CONFIRM_WORD}" untuk mengonfirmasi.`}
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Peringatan!</AlertTitle>
            <AlertDescription>
              Harap berhati-hati, operasi ini tidak dapat dibatalkan.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Hapus'
      destructive
    />
  )
}
