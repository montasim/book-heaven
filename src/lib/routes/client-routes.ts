import {
  BookOpen,
  Bookmark,
  Brain,
  Settings,
  LayoutDashboard,
  Library,
  User,
  MessageSquare,
  ShoppingBag,
  Plus,
  PenTool,
  Bell,
  Palette,
  Monitor,
  CreditCard,
  FolderTree,
  Home,
  ShieldCheck,
  Globe,
  BarChart3,
  RefreshCw,
  Inbox,
  Upload,
  BookMarked,
  FileText,
  Hash,
  List,
  Trophy,
  Target,
  Crown,
  HelpCircle,
  Info,
  Mail,
  FileCheck,
  Lock,
  Users,
  LogIn,
  UserPlus,
  TrendingUp,
  Sparkles,
  Megaphone,
  ChevronRight,
  Link2,
  Ticket,
} from 'lucide-react'
import { AccessConfig, AccessLevel, RoleAccess } from '@/lib/auth/roles'

export interface AppRoute extends AccessConfig {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

/**
 * Global app routes configuration
 * Define all routes here with their labels, paths, and icons
 * Use the route name to reference it in components
 */
export const ROUTES = {
  // Public Routes
  home: {
    label: 'Home',
    href: '/',
    icon: Home,
    access: RoleAccess.ALL,
  },

  // Books & Library
  books: {
    label: 'Books',
    href: '/books',
    icon: BookOpen,
    access: RoleAccess.ALL,
  },
  library: {
    label: 'Library',
    href: '/library',
    icon: Library,
    access: RoleAccess.ALL,
  },

  // Quiz
  quiz: {
    label: 'Quiz',
    href: '/quiz',
    icon: Brain,
    access: RoleAccess.ALL,
  },

  // Premium
  premium: {
    label: 'Premium',
    href: '/premium',
    icon: Crown,
    access: RoleAccess.ALL,
  },

  // Dashboard
  dashboard: {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    access: RoleAccess.AUTHENTICATED,
  },

  // Settings
  settings: {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    access: RoleAccess.AUTHENTICATED,
  },

  // User Settings Sub-routes
  settingsAccount: {
    label: 'Account',
    href: '/dashboard/settings/account',
    icon: User,
    access: RoleAccess.AUTHENTICATED,
  },
  settingsAppearance: {
    label: 'Appearance',
    href: '/dashboard/settings/appearance',
    icon: Palette,
    access: RoleAccess.AUTHENTICATED,
  },
  settingsBilling: {
    label: 'Billing',
    href: '/dashboard/settings/billing',
    icon: CreditCard,
    access: RoleAccess.AUTHENTICATED,
  },
  settingsNotifications: {
    label: 'Notifications',
    href: '/dashboard/settings/notifications',
    icon: Bell,
    access: RoleAccess.AUTHENTICATED,
  },
  settingsSubscription: {
    label: 'Subscription',
    href: '/dashboard/settings/subscription',
    icon: Crown,
    access: RoleAccess.AUTHENTICATED,
  },
  settingsDisplay: {
    label: 'Display',
    href: '/dashboard/settings/display',
    icon: Monitor,
    access: RoleAccess.AUTHENTICATED,
  },

  // Marketplace
  marketplace: {
    label: 'Marketplace',
    href: '/marketplace',
    icon: ShoppingBag,
    access: RoleAccess.AUTHENTICATED,
  },

  // Messages
  messages: {
    label: 'Messages',
    href: '/dashboard/marketplace/messages',
    icon: MessageSquare,
    access: RoleAccess.AUTHENTICATED,
  },

  // Library Sub-routes
  libraryMyRequests: {
    label: 'My Requests',
    href: '/library/my-requests',
    icon: Inbox,
    access: RoleAccess.AUTHENTICATED,
  },

  // Activity
  dashboardActivity: {
    label: 'Activity',
    href: '/dashboard/activity',
    icon: BarChart3,
    access: RoleAccess.AUTHENTICATED,
  },

  // Support Routes
  helpCenter: {
    label: 'Help Center',
    href: '/help-center',
    icon: HelpCircle,
    access: RoleAccess.ALL,
  },
  about: {
    label: 'About Us',
    href: '/about',
    icon: Info,
    access: RoleAccess.ALL,
  },
  contact: {
    label: 'Contact',
    href: '/contact',
    icon: Mail,
    access: RoleAccess.ALL,
  },

  // Legal Routes
  terms: {
    label: 'Terms of Service',
    href: '/terms',
    icon: FileCheck,
    access: RoleAccess.ALL,
  },
  privacy: {
    label: 'Privacy Policy',
    href: '/privacy',
    icon: Lock,
    access: RoleAccess.ALL,
  },

  // Categories
  categories: {
    label: 'Categories',
    href: '/categories',
    icon: FolderTree,
    access: RoleAccess.ALL,
  },

  // Authors
  authors: {
    label: 'Authors',
    href: '/authors',
    icon: Users,
    access: RoleAccess.ALL,
  },

  // Translators
  translators: {
    label: 'Translators',
    href: '/translators',
    icon: Users,
    access: RoleAccess.ALL,
  },

  // Series
  series: {
    label: 'Series',
    href: '/series',
    icon: Hash,
    access: RoleAccess.ALL,
  },

  // Publications
  publications: {
    label: 'Publications',
    href: '/publications',
    icon: Globe,
    access: RoleAccess.ALL,
  },

  // Physical Library
  physicalLibrary: {
    label: 'Physical Library',
    href: '/physical-library',
    icon: Library,
    access: RoleAccess.ALL,
  },

  // Quiz & Leaderboard
  quizLeaderboard: {
    label: 'Leaderboard',
    href: '/quiz/leaderboard',
    icon: Trophy,
    access: RoleAccess.ALL,
  },

  // Notices
  notices: {
    label: 'Notices',
    href: '/notices',
    icon: Megaphone,
    access: RoleAccess.ALL,
  },

  // Auth Routes
  signIn: {
    label: 'Sign In',
    href: '/auth/sign-in',
    icon: LogIn,
    access: RoleAccess.ALL,
  },
  signUp: {
    label: 'Sign Up',
    href: '/auth/sign-up',
    icon: UserPlus,
    access: RoleAccess.ALL,
  },
  login: {
    label: 'Login',
    href: '/login',
    icon: LogIn,
    access: RoleAccess.ALL,
  },
  signUpSimple: {
    label: 'Sign Up',
    href: '/sign-up',
    icon: UserPlus,
    access: RoleAccess.ALL,
  },
  otp: {
    label: 'OTP',
    href: '/otp',
    icon: Lock,
    access: RoleAccess.ALL,
  },
  forgotPassword: {
    label: 'Forgot Password',
    href: '/forgot-password',
    icon: HelpCircle,
    access: RoleAccess.ALL,
  },

  // Marketplace Routes
  marketplacePosts: {
    label: 'My Posts',
    href: '/dashboard/marketplace/posts',
    icon: ShoppingBag,
    access: RoleAccess.AUTHENTICATED,
  },
  marketplaceConversations: {
    label: 'Conversations',
    href: '/dashboard/marketplace/conversations',
    icon: MessageSquare,
    access: RoleAccess.AUTHENTICATED,
  },
  marketplaceAnalytics: {
    label: 'Analytics',
    href: '/dashboard/marketplace/analytics',
    icon: BarChart3,
    access: RoleAccess.AUTHENTICATED,
  },

  // Messages Route
  messagesSimple: {
    label: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    access: RoleAccess.AUTHENTICATED,
  },

  // Offers
  offersSent: {
    label: 'My Offers',
    href: '/offers/sent',
    icon: TrendingUp,
    access: RoleAccess.AUTHENTICATED,
  },
  offersReceived: {
    label: 'Received Offers',
    href: '/offers/received',
    icon: Inbox,
    access: RoleAccess.AUTHENTICATED,
  },

  // Site Settings
  siteSettings: {
    label: 'Site Settings',
    href: '/dashboard/site-settings',
    icon: Settings,
    access: RoleAccess.ADMIN_ONLY,
  },

  // Moods
  moods: {
    label: 'Moods',
    href: '/dashboard/moods',
    icon: Sparkles,
    access: RoleAccess.AUTHENTICATED,
  },
  seedMoods: {
    label: 'Seed Moods',
    href: '/dashboard/seed-moods',
    icon: RefreshCw,
    access: RoleAccess.ADMIN_ONLY,
  },

  // Subscription
  signup: {
    label: 'Sign Up',
    href: '/signup',
    icon: UserPlus,
    access: RoleAccess.ALL,
  },
  pricing: {
    label: 'Pricing',
    href: '/pricing',
    icon: Crown,
    access: RoleAccess.ALL,
  },

  // Dashboard Routes
  dashboardUsers: {
    label: 'Users',
    href: '/dashboard/users',
    icon: Users,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardCampaigns: {
    label: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: Mail,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardNotices: {
    label: 'Notices',
    href: '/dashboard/notices',
    icon: Bell,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardActivities: {
    label: 'Activity Logs',
    href: '/dashboard/activities',
    icon: BarChart3,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardSupportTickets: {
    label: 'Support Tickets',
    href: '/dashboard/support-tickets',
    icon: MessageSquare,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardHelpCenterFaqs: {
    label: 'Help Center FAQs',
    href: '/dashboard/help-center/faqs',
    icon: HelpCircle,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardAdminContactSubmissions: {
    label: 'Contact Submissions',
    href: '/dashboard/admin/contact-submissions',
    icon: Mail,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardLegal: {
    label: 'Legal Content',
    href: '/dashboard/legal',
    icon: FileText,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardAdminContent: {
    label: 'Pricing Page Content',
    href: '/dashboard/admin/content',
    icon: Sparkles,
    access: RoleAccess.ADMIN_ONLY,
  },

  // Library Management
  dashboardBooks: {
    label: 'Books',
    href: '/dashboard/books',
    icon: BookOpen,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardSeries: {
    label: 'Series',
    href: '/dashboard/series',
    icon: List,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardAuthors: {
    label: 'Authors',
    href: '/dashboard/authors',
    icon: User,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardTranslators: {
    label: 'Translators',
    href: '/dashboard/translators',
    icon: User,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardPublications: {
    label: 'Publications',
    href: '/dashboard/publications',
    icon: Globe,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardCategories: {
    label: 'Categories',
    href: '/dashboard/categories',
    icon: Hash,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardBookRequests: {
    label: 'Book Requests',
    href: '/dashboard/book-requests',
    icon: BookMarked,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardLoans: {
    label: 'Borrowed Books',
    href: '/dashboard/borrowed-books',
    icon: ShieldCheck,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardBooksCostAnalytics: {
    label: 'Cost Analytics',
    href: '/dashboard/books/cost-analytics',
    icon: CreditCard,
    access: RoleAccess.ADMIN_ONLY,
  },

  // Marketplace
  marketplaceMyPosts: {
    label: 'My Listings',
    href: '/marketplace/my-posts',
    icon: ShoppingBag,
    access: RoleAccess.AUTHENTICATED,
  },
  dashboardMarketplace: {
    label: 'Marketplace Overview',
    href: '/dashboard/marketplace',
    icon: LayoutDashboard,
    access: RoleAccess.AUTHENTICATED,
  },
  dashboardMarketplaceReviews: {
    label: 'Reviews',
    href: '/dashboard/marketplace/reviews',
    icon: Trophy,
    access: RoleAccess.AUTHENTICATED,
  },

  // Other Routes
  profileLoans: {
    label: 'Borrowed Books',
    href: '/borrowed-books',
    icon: ShieldCheck,
    access: RoleAccess.AUTHENTICATED,
  },
  achievements: {
    label: 'Achievements',
    href: '/achievements',
    icon: Trophy,
    access: RoleAccess.AUTHENTICATED,
  },
  libraryMyUploads: {
    label: 'My Library',
    href: '/library?tab=my-uploads',
    icon: Bookmark,
    access: RoleAccess.AUTHENTICATED,
  },

  // Blog Routes
  blog: {
    label: 'Blog',
    href: '/blog',
    icon: FileText,
    access: RoleAccess.ALL,
  },
  dashboardBlog: {
    label: 'Blog Posts',
    href: '/dashboard/blog',
    icon: FileText,
    access: RoleAccess.ADMIN_ONLY,
  },
  dashboardBlogComments: {
    label: 'Blog Comments',
    href: '/dashboard/blog/comments',
    icon: MessageSquare,
    access: RoleAccess.ADMIN_ONLY,
  },
} as const

export type RouteKey = keyof typeof ROUTES

/**
 * Helper to get route by key
 */
export function getRoute(key: RouteKey): AppRoute {
  return ROUTES[key]
}

/**
 * Helper to get multiple routes by keys
 */
export function getRoutes(keys: RouteKey[]): AppRoute[] {
  return keys.map(key => ROUTES[key])
}
