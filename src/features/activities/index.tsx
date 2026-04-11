import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { getActivities } from './api/activities'
import { ActivitiesDialogs } from './components/activities-dialogs'
import { ActivitiesPrimaryButtons } from './components/activities-primary-buttons'
import {
  ActivitiesProvider,
  useActivities,
} from './components/activities-provider'
import { ActivitiesTable } from './components/activities-table'

import { useAuth } from '@/context/auth-provider'

function ActivitiesFAB() {
  const { setOpen } = useActivities()
  return (
    <Button
      className='fixed bottom-6 right-6 z-50 h-14 gap-2 rounded-full px-5 shadow-lg sm:hidden'
      onClick={() => setOpen('create')}
      size='lg'
    >
      <Plus className='h-5 w-5' />
      Aktivitas Baru
    </Button>
  )
}

export function Activities() {
  const { user } = useAuth()
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', user?.id],
    queryFn: () => getActivities(user?.id),
    enabled: !!user?.id,
  })

  return (
    <ActivitiesProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>Aktivitas</h2>
            <p className='text-muted-foreground'>Daftar aktivitas Anda.</p>
          </div>
          <ActivitiesPrimaryButtons />
        </div>
        <ActivitiesTable data={activities} isLoading={isLoading} />
      </Main>

      <ActivitiesFAB />
      <ActivitiesDialogs />
    </ActivitiesProvider>
  )
}
