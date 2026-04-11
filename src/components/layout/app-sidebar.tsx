import { useAuth } from '@/context/auth-provider'
import { useProfile } from '@/hooks/use-profile'
import { useUserRoles } from '@/hooks/use-user-roles'
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
import { type NavItem } from './types'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { data: userRoles = [] } = useUserRoles()

  const fallbackName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User'

  const userData = {
    name: profile?.name ?? fallbackName,
    email: user?.email ?? '',
    avatar: user?.user_metadata?.avatar_url ?? '/avatars/default.png',
  }

  /** Filter a list of nav items based on the user's roles */
  function filterItems(items: NavItem[]): NavItem[] {
    return items.filter((item) => {
      // No role restriction → always visible
      if (!item.roles || item.roles.length === 0) return true
      // Visible only if user has at least one of the required roles
      return item.roles.some((r) => userRoles.includes(r))
    })
  }

  const filteredNavGroups = sidebarData.navGroups
    .map((group) => ({ ...group, items: filterItems(group.items) }))
    .filter((group) => group.items.length > 0)

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <AppTitle />
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((props) => (
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
