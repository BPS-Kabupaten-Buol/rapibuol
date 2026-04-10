import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteActivity } from '@/features/activities/api/activities'
import { ActivitiesImportDialog } from './activities-import-dialog'
import { ActivitiesMutateDrawer } from './activities-mutate-drawer'
import { useActivities } from './activities-provider'

export function ActivitiesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useActivities()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success('Aktivitas berhasil dihapus')
    },
    onError: () => {
      toast.error('Gagal menghapus aktivitas')
    },
  })

  return (
    <>
      <ActivitiesMutateDrawer
        key='activity-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      <ActivitiesImportDialog
        key='tasks-import'
        open={open === 'import'}
        onOpenChange={() => setOpen('import')}
      />

      {currentRow && (
        <>
          <ActivitiesMutateDrawer
            key={`activity-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => {
              setOpen('update')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key='activity-delete'
            destructive
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            handleConfirm={() => {
              deleteMutation.mutate(currentRow.id)
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            className='max-w-md'
            title={`Hapus aktivitas ini?`}
            desc={
              <>
                Anda akan menghapus aktivitas{' '}
                <span className='font-bold'>{currentRow.description}</span>{' '}
                <br />
                Tindakan ini tidak dapat dibatalkan.
              </>
            }
            confirmText='Hapus'
          />
        </>
      )}
    </>
  )
}
