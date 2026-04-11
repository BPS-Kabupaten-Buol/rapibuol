import { useAuth } from '@/context/auth-provider'
import { useProfile } from '@/hooks/use-profile'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)

  const fallbackName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User'

  const userData = {
    name: profile?.name ?? fallbackName,
    email: user?.email ?? '',
    avatar: user?.user_metadata?.avatar_url ?? '/avatars/default.png',
  }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <AppTitle />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
