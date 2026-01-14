import {
  IconBuildingStore,
  IconTag,
} from '@tabler/icons-react'
import {
    AudioWaveform,
    BookOpen,
    Brain,
    GalleryVerticalEnd,
    LayoutDashboard,
    Activity,
    Layers,
    PenTool,
    ShoppingBag,
    HandCoins,
    TrendingUp,
    Construction,
    FileText,
    Megaphone,
    Bell,
    BarChart3,
    MessageSquare,
    Star,
    FileQuestion,
    Smile,
    Users,
    Trophy,
    Library,
    ShieldBan,
    HelpCircle,
    Mail,
    Clock,
    Settings,
    Wrench,
    Receipt,
    Palette,
    Monitor,
    Languages,
} from 'lucide-react'
import { type SidebarData, UserRole } from '../types'
import { ROUTES } from '@/lib/routes/client-routes'

export const sidebarData: SidebarData = {
  user: {
    name: '',
    email: '',
    avatar: '/avatars/default.svg',
  },
  teams: [
    {
      name: 'My Library',
      logo: BookOpen,
      plan: 'Digital Library',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    // ============================================================================
    // OVERVIEW - Admin & Super Admin only
    // ============================================================================
    {
      title: 'Overview',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      items: [
        {
          title: 'Dashboard',
          url: ROUTES.dashboard.href,
          icon: LayoutDashboard,
        },
        {
          title: 'Activities',
          url: ROUTES.dashboardActivities.href,
          icon: Activity,
        },
      ],
    },

    // ============================================================================
    // LIBRARY MANAGEMENT - Admin & Super Admin only
    // ============================================================================
    {
      title: 'Library Management',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      items: [
        {
          title: 'Books',
          url: ROUTES.dashboardBooks.href,
          icon: BookOpen,
        },
        {
          title: 'Series',
          url: ROUTES.dashboardSeries.href,
          icon: Layers,
        },
        {
          title: 'Authors',
          url: ROUTES.dashboardAuthors.href,
          icon: PenTool,
        },
        {
          title: 'Translators',
          url: ROUTES.dashboardTranslators.href,
          icon: Languages,
        },
        {
          title: 'Publications',
          url: ROUTES.dashboardPublications.href,
          icon: IconBuildingStore,
        },
        {
          title: 'Categories',
          url: ROUTES.dashboardCategories.href,
          icon: IconTag,
        },
      ],
    },
    {
      title: 'Library Operations',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      items: [
        {
          title: 'Book Requests',
          url: ROUTES.dashboardBookRequests.href,
          icon: FileQuestion,
        },
        {
          title: 'Borrowed Books',
          url: ROUTES.dashboardLoans.href,
          icon: HandCoins,
        },
        {
          title: 'Cost Analytics',
          url: ROUTES.dashboardBooksCostAnalytics.href,
          icon: TrendingUp,
        },
      ],
    },

    // ============================================================================
    // CONTENT MANAGEMENT - Admin & Super Admin (Blog), All roles (Blog Posts)
    // ============================================================================
    {
      title: 'Content Management',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      items: [
        {
          title: 'Site Settings',
          url: ROUTES.siteSettings.href,
          icon: Construction,
        },
        {
          title: 'Blog Posts',
          url: ROUTES.dashboardBlog.href,
          icon: FileText,
        },
        {
          title: 'Pricing Content',
          url: ROUTES.dashboardAdminContent.href,
          icon: FileText,
        },
        {
          title: 'Legal Content',
          url: ROUTES.dashboardLegal.href,
          icon: FileText,
          roles: ['SUPER_ADMIN'],
        },
        {
          title: 'Notices',
          url: ROUTES.dashboardNotices.href,
          icon: Megaphone,
        },
        {
          title: 'Help Center FAQs',
          url: ROUTES.dashboardHelpCenterFaqs.href,
          icon: HelpCircle,
        },
      ],
    },

    // ============================================================================
    // BLOG - All roles (view), Admin & Super Admin (manage)
    // ============================================================================
    {
      title: 'Blog',
      items: [
        {
          title: 'Blog Posts',
          url: ROUTES.dashboardBlog.href,
          icon: FileText,
          roles: ['ADMIN', 'SUPER_ADMIN', 'USER'],
        },
        {
          title: 'Comments',
          url: ROUTES.dashboardBlogComments.href,
          icon: MessageSquare,
          roles: ['ADMIN', 'SUPER_ADMIN'],
        },
      ],
    },

    // ============================================================================
    // USER MANAGEMENT - Admin & Super Admin only
    // ============================================================================
    {
      title: 'User Management',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      items: [
        {
          title: 'Users',
          url: ROUTES.dashboardUsers.href,
          icon: Users,
        },
        {
          title: 'Campaigns',
          url: ROUTES.dashboardCampaigns.href,
          icon: Megaphone,
        },
        {
          title: 'Support Tickets',
          url: ROUTES.dashboardSupportTickets.href,
          icon: MessageSquare,
        },
        {
          title: 'Contact Submissions',
          url: ROUTES.dashboardAdminContactSubmissions.href,
          icon: Mail,
        },
      ],
    },

    // ============================================================================
    // MARKETPLACE - Admin & Super Admin only
    // ============================================================================
    {
      title: 'Marketplace',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      items: [
        {
          title: 'Overview',
          url: ROUTES.dashboardMarketplace.href,
          icon: LayoutDashboard,
        },
        {
          title: 'Conversations',
          url: ROUTES.marketplaceConversations.href,
          icon: MessageSquare,
        },
        {
          title: 'Reviews',
          url: ROUTES.dashboardMarketplaceReviews.href,
          icon: Star,
        },
      ],
    },

    // ============================================================================
    // PERSONAL - All roles (except Moods which is admin only)
    // ============================================================================
    {
      title: 'Personal',
      items: [
        {
          title: 'My Library',
          url: ROUTES.libraryMyUploads.href,
          icon: Library,
        },
        {
          title: 'Borrowed Books',
          url: ROUTES.profileLoans.href,
          icon: ShieldBan,
        },
        {
          title: 'Achievements',
          url: ROUTES.achievements.href,
          icon: Trophy,
        },
        {
          title: 'Moods',
          url: ROUTES.moods.href,
          icon: Smile,
          roles: ['ADMIN', 'SUPER_ADMIN'],
        },
      ],
    },

    // ============================================================================
    // SETTINGS - All roles
    // ============================================================================
    {
      title: 'Settings',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'General',
              url: ROUTES.settings.href,
              icon: Settings,
            },
            {
              title: 'Account',
              url: ROUTES.settingsAccount.href,
              icon: Wrench,
            },
            {
              title: 'Subscription',
              url: ROUTES.settingsSubscription.href,
              icon: Trophy,
            },
            {
              title: 'Billing',
              url: ROUTES.settingsBilling.href,
              icon: Receipt,
            },
            {
              title: 'Appearance',
              url: ROUTES.settingsAppearance.href,
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: ROUTES.settingsNotifications.href,
              icon: Bell,
            },
            {
              title: 'Display',
              url: ROUTES.settingsDisplay.href,
              icon: Monitor,
            },
          ],
        },
        {
          title: 'My Activity',
          url: ROUTES.dashboardActivity.href,
          icon: Clock,
        },
      ],
    },
  ],
}
