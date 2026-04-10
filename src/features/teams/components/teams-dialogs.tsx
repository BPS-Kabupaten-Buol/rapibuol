import { TeamsActionDialog } from './teams-action-dialog'
import { TeamsDeleteDialog } from './teams-delete-dialog'
import { TeamsMembersDialog } from './teams-members-dialog'

export function TeamsDialogs() {
  return (
    <>
      <TeamsActionDialog />
      <TeamsDeleteDialog />
      <TeamsMembersDialog />
    </>
  )
}
