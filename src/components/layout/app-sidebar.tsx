'use client'

import { useState, useEffect } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '../ui/sidebar'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { sidebarData } from './data/sidebar-data'
import {useAuth} from "@/context/auth-context"
import type { NavGroup as NavGroupType, NavItem, UserRole } from './types'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  // Fix hydration mismatch by only rendering after client mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Filter navigation items based on user role
  const filterNavItems = (items: NavItem[]): NavItem[] => {
    if (!user?.role) return []

    return items
      .filter(item => {
        // If item has roles specified, check if user's role is included
        if (item.roles && !item.roles.includes(user.role as UserRole)) {
          return false
        }
        return true
      })
      .map(item => {
        // If item has nested items, filter those too
        if ('items' in item && item.items) {
          return {
            ...item,
            items: item.items.filter(subItem => {
              // If sub-item has roles specified, check if user's role is included
              if (subItem.roles && !subItem.roles.includes(user.role as UserRole)) {
                return false
              }
              return true
            })
          }
        }
        return item
      })
  }

  // Filter navigation groups based on user role
  const filteredNavGroups: NavGroupType[] = []

  if (isMounted && user?.role) {
    sidebarData.navGroups.forEach(group => {
      // Check if group has roles and if user's role is included
      if (group.roles && !group.roles.includes(user.role as UserRole)) {
        return // Skip this group
      }

      // Filter items within the group
      const filteredItems = filterNavItems(group.items)

      // Only add group if it has items after filtering
      if (filteredItems.length > 0) {
        filteredNavGroups.push({
          ...group,
          items: filteredItems
        })
      }
    })
  }

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {isMounted && filteredNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        {isMounted && user && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
