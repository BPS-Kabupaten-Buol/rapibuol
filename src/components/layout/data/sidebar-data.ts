import {
  CalendarDays,
  LayoutDashboard,
  ListTodo,
  HelpCircle,
  Palette,
  Settings,
  Wrench,
  Users,
  Users2,
} from 'lucide-react'
import { type SidebarData } from '../types'
import {
  TEAM_MANAGEMENT_ROLES,
  USER_MANAGEMENT_ROLES,
} from '@/lib/roles'

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Aktivitas',
          url: '/activities',
          icon: ListTodo,
        },
        {
          title: 'Kalender',
          url: '/calendar',
          icon: CalendarDays,
        },
        {
          title: 'Tim',
          url: '/teams',
          icon: Users2,
          roles: TEAM_MANAGEMENT_ROLES,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
          roles: USER_MANAGEMENT_ROLES,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Account',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
