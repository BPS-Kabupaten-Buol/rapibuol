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
      toast.success('Team deleted successfully!')
      onDeleteDialogOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete team'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isDeleteOpen} onOpenChange={onDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Team</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the team "{selectedTeam?.name}"?
            This action cannot be undone. All team members will be removed from
            this team.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className='flex gap-2'>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className='text-destructive-foreground bg-destructive hover:bg-destructive/90'
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
