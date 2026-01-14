interface User {
  name: string
  email: string
  avatar: string
}

interface Team {
  name: string
  logo: React.ElementType
  plan: string
}

type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'

interface BaseNavItem {
  title: string
  badge?: string
  icon?: React.ElementType
  /** Roles that can see this item. If undefined, all roles can see it */
  roles?: UserRole[]
}

type NavLink = BaseNavItem & {
  url: string
  items?: never
}

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: string })[]
  url?: never
}

type NavItem = NavCollapsible | NavLink

interface NavGroup {
  title: string
  items: NavItem[]
  /** Roles that can see this group. If undefined, all roles can see it */
  roles?: UserRole[]
}

interface SidebarData {
  user: User
  teams: Team[]
  navGroups: NavGroup[]
}

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink, UserRole }
