import { format } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteActivity } from '@/features/activities/api/activities'
import { GoogleTasksImportDialog } from '@/features/google-tasks/components/google-tasks-import-dialog'
import { ActivityDetailDrawer } from './activity-detail-drawer'
import { ActivitiesImportDialog } from './activities-import-dialog'
import { ActivitiesMutateDrawer } from './activities-mutate-drawer'
import { useActivities } from './activities-provider'

export function ActivitiesDialogs() {
  const {
    open,
    setOpen,
    currentRow,
    setCurrentRow,
    defaultDate,
    defaultQuadrant,
    detailActivity,
    setDetailActivity,
    duplicateFrom,
    setDuplicateFrom,
  } = useActivities()
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
      <ActivityDetailDrawer
        open={!!detailActivity}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDetailActivity(null)
        }}
        activity={detailActivity}
        onEdit={(activity) => {
          setDetailActivity(null)
          setCurrentRow(activity)
          setOpen('update')
        }}
        onDelete={(activity) => {
          setDetailActivity(null)
          setCurrentRow(activity)
          setOpen('delete')
        }}
        onDuplicate={(activity) => {
          setDetailActivity(null)
          setDuplicateFrom(activity)
          setOpen('create')
        }}
        onNotesSaved={(activity, notes) => {
          // Abaikan hasil simpan yang datang setelah drawer ditutup.
          if (detailActivity?.id !== activity.id) return
          setDetailActivity({ ...activity, notes })
        }}
      />

      <ActivitiesMutateDrawer
        key={`activity-create-${defaultDate ? format(defaultDate, 'yyyy-MM-dd') : 'today'}-${defaultQuadrant ?? 'none'}-${duplicateFrom?.id ?? 'new'}`}
        open={open === 'create'}
        onOpenChange={() => {
          setOpen('create')
          setDuplicateFrom(null)
        }}
        defaultDate={defaultDate ?? undefined}
        defaultQuadrant={defaultQuadrant}
        duplicateFrom={duplicateFrom}
      />

      <ActivitiesImportDialog
        key='tasks-import'
        open={open === 'import'}
        onOpenChange={() => setOpen('import')}
      />

      <GoogleTasksImportDialog
        open={open === 'google-tasks'}
        onOpenChange={() => setOpen('google-tasks')}
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
