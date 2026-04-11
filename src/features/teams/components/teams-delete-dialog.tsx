import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTeamDialog } from './teams-provider'

export function TeamsDeleteDialog() {
  const { isDeleteOpen, onDeleteDialogOpen, selectedTeam, deleteTeam } =
    useTeamDialog()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!selectedTeam) return

    setIsDeleting(true)
    try {
      await deleteTeam(selectedTeam.id)
      toast.success('Tim berhasil dihapus!')
      onDeleteDialogOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal menghapus tim'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isDeleteOpen} onOpenChange={onDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Tim</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus tim "{selectedTeam?.name}"?
            Tindakan ini tidak dapat dibatalkan. Semua anggota tim akan dihapus dari
            tim ini.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className='flex gap-2'>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className='text-destructive-foreground bg-destructive hover:bg-destructive/90'
          >
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
