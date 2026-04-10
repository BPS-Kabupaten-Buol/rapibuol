import { useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useTeams, useTeamMembers } from '../hooks'
import { AddMemberDialog } from './add-member-dialog'
import { TeamDetailProvider } from './team-detail-provider'
import { TeamMembersTable } from './team-members-table'

const route = getRouteApi('/_authenticated/teams/$teamId')

export function TeamDetail() {
  const { teamId } = route.useParams()
  const navigate = route.useNavigate()
  const [isAddOpen, setIsAddOpen] = useState(false)

  const teamIdNum = parseInt(teamId, 10)
  const { teams } = useTeams()
  const { members, isLoading, addMember, removeMember } =
    useTeamMembers(teamIdNum)

  const team = teams.find((t) => t.id === teamIdNum)

  if (!team) {
    return (
      <Main className='flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-lg font-medium text-muted-foreground'>
            Team not found
          </p>
          <Button
            variant='outline'
            onClick={() => navigate({ to: '/teams' })}
            className='mt-4'
          >
            Back to Teams
          </Button>
        </div>
      </Main>
    )
  }

  return (
    <TeamDetailProvider>
      <Header fixed>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate({ to: '/teams' })}
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <Search />
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{team.name}</h2>
            <p className='text-muted-foreground'>
              Leader: {team.leader_name || 'Unassigned'} • {members.length}{' '}
              {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} size='sm'>
            <Plus className='mr-2 h-4 w-4' />
            Add Member
          </Button>
        </div>

        <TeamMembersTable
          members={members}
          isLoading={isLoading}
          onRemove={removeMember}
        />

        <AddMemberDialog
          isOpen={isAddOpen}
          onOpenChange={setIsAddOpen}
          teamId={teamIdNum}
          onAddMember={addMember}
          currentMembers={members}
        />
      </Main>
    </TeamDetailProvider>
  )
}
