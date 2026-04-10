import { UserEditRoleDialog } from './user-edit-role-dialog'
import { UsersActionDialog } from './users-action-dialog'
import { useUsersDialog } from './users-provider'

export function UsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useUsersDialog()
  return (
    <>
      <UsersActionDialog
        key='user-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <UserEditRoleDialog
          key={`user-edit-${currentRow.id}`}
          user={currentRow}
          open={open === 'edit'}
          onOpenChange={() => {
            setOpen('edit')
            setTimeout(() => {
              setCurrentRow(null)
            }, 500)
          }}
        />
      )}
    </>
  )
}
