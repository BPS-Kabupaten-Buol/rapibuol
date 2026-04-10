import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useSupabaseAuth } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ActivitiesDialogs } from '@/features/activities/components/activities-dialogs'
import {
  ActivitiesProvider,
  useActivities,
} from '@/features/activities/components/activities-provider'
import KepalaSatkerDashboard from './components/kepala-satker-dashboard'
import TeamLeaderDashboard from './components/team-leader-dashboard'
import UserDashboard from './components/user-dashboard'

function DashboardFAB() {
  const { setOpen } = useActivities()
  return (
    <Button
      className='fixed right-6 bottom-6 z-50 h-14 gap-2 rounded-full px-5 shadow-lg'
      onClick={() => setOpen('create')}
      size='lg'
    >
      <Plus className='h-5 w-5' />
      Aktivitas Baru
    </Button>
  )
}

function DashboardContent() {
  const { session } = useSupabaseAuth()
  const userId = session?.user?.id

  // Fetch Roles
  const { data: roles } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data } = await supabase
        .from('users_roles')
        .select('role_id')
        .eq('user_id', userId)
      return data?.map((r) => r.role_id) || []
    },
    enabled: !!userId,
  })

  // Fetch Teams Led by User
  const { data: teamsLed } = useQuery({
    queryKey: ['user-teams-led', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data } = await supabase
        .from('teams')
        .select('id, name')
        .eq('leader', userId)
      return data || []
    },
    enabled: !!userId,
  })

  const isSatker = roles?.includes(1) || roles?.includes(2)
  const isTeamLeader = teamsLed && teamsLed.length > 0

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
        </div>
        <Tabs orientation='vertical' defaultValue='saya' className='space-y-4'>
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='saya'>Dashboard Saya</TabsTrigger>
              {isTeamLeader && (
                <TabsTrigger value='tim'>Dashboard Tim</TabsTrigger>
              )}
              {isSatker && (
                <TabsTrigger value='satker'>Dashboard Satker</TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value='saya' className='space-y-4'>
            {userId ? <UserDashboard userId={userId} /> : <p>Loading...</p>}
          </TabsContent>

          {isTeamLeader && (
            <TabsContent value='tim' className='space-y-4'>
              {userId ? (
                <TeamLeaderDashboard userId={userId} teams={teamsLed} />
              ) : (
                <p>Loading...</p>
              )}
            </TabsContent>
          )}

          {isSatker && (
            <TabsContent value='satker' className='space-y-4'>
              <KepalaSatkerDashboard />
            </TabsContent>
          )}
        </Tabs>
      </Main>

      <DashboardFAB />
      <ActivitiesDialogs />
    </>
  )
}

export function Dashboard() {
  return (
    <ActivitiesProvider>
      <DashboardContent />
    </ActivitiesProvider>
  )
}
