export type SiteConfig = {
  name: string
  description: string
  url: string
  ogImage: string
  links: {
    github: string
  }
}

export type NavItem = {
  title: string
  href: string
  disabled?: boolean
}

export type MainNavItem = NavItem

export type DashboardConfig = {
  mainNav: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

export type SidebarNavItem = {
  title: string
  disabled?: boolean
  external?: boolean
  icon?: keyof typeof Icons
} & (
  | {
      href: string
      items?: never
    }
  | {
      href?: string
      items: NavLink[]
    }
)

export type User = {
  avatar: string
  collectionId: string
  collectionName: string
  created: string // Consider using Date if you want to work with Date objects.
  email: string
  emailVisibility: boolean
  id: string
  name: string
  updated: string // Consider using Date if you want to work with Date objects.
  username: string
  verified: boolean
}
