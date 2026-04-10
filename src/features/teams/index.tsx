import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { TeamsDialogs } from './components/teams-dialogs'
import { TeamsPrimaryButtons } from './components/teams-primary-buttons'
import { TeamsProvider } from './components/teams-provider'
import { useTeamDialog } from './components/teams-provider'
import { TeamsTable } from './components/teams-table'

const route = getRouteApi('/_authenticated/teams/')

function TeamsContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { teams, isLoading, error } = useTeamDialog()

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Teams</h2>
            <p className='text-muted-foreground'>
              Manage your teams and members here.
            </p>
          </div>
          <TeamsPrimaryButtons />
        </div>
        {error ? (
          <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'>
            <p className='font-medium'>Error loading teams</p>
            <p className='text-sm'>{error}</p>
          </div>
        ) : (
          <TeamsTable
            data={teams}
            search={search}
            navigate={navigate}
            isLoading={isLoading}
          />
        )}
      </Main>

      <TeamsDialogs />
    </>
  )
}

export function Teams() {
  return (
    <TeamsProvider>
      <TeamsContent />
    </TeamsProvider>
  )
}
