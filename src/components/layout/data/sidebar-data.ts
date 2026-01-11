import {
  IconBook,
  IconBrowserCheck,
  IconFileText,
  IconHelp,
  IconMessages,
  IconNotification,
  IconPalette,
  IconTool,
  IconUserCog,
  IconTag,
  IconBuildingStore,
  IconUser,
  IconBooks,
  IconBookmark,
  IconBuildingFactory,
  IconMoodSmile,
  IconStar,
  IconHistory,
  IconTrophy,
  IconHandStop,
  IconLibrary,
  IconReceipt,
  IconCrown,
  IconLayoutDashboard,
  IconSettings,
  IconShield,
  IconUsers,
  IconMail,
  IconDeviceDesktop,
} from '@tabler/icons-react'
import {
  AudioWaveform,
  BookOpen as BookOpenIcon,
  Brain,
  GalleryVerticalEnd,
  HandCoins,
  Layers,
  Megaphone,
  PenTool,
  TrendingUp,
  Bell,
  BarChart3,
  MessageSquare,
  ShoppingBag,
  Inbox,
  Activity,
} from 'lucide-react'
import { type SidebarData } from '../types'
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
      logo: BookOpenIcon,
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
    // OVERVIEW
    // ============================================================================
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          url: ROUTES.dashboard.href,
          icon: IconLayoutDashboard,
        },
          {
              title: 'Activities',
              url: ROUTES.dashboardActivities.href,
              icon: IconHistory,
          },
      ],
    },

    // ============================================================================
    // LIBRARY MANAGEMENT
    // ============================================================================
    {
      title: 'Library Management',
      items: [
        {
          title: 'Books',
          url: ROUTES.dashboardBooks.href,
          icon: IconBook,
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
      items: [
        {
          title: 'Book Requests',
          url: ROUTES.dashboardBookRequests.href,
          icon: IconBooks,
        },
        {
          title: 'Loans',
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
    // CONTENT MANAGEMENT
    // ============================================================================
    {
      title: 'Content Management',
      items: [
        {
          title: 'Site Settings',
          url: ROUTES.siteSettings.href,
          icon: IconBuildingFactory,
        },
        {
          title: 'Pricing Content',
          url: ROUTES.dashboardAdminContent.href,
          icon: IconCrown,
        },
        {
          title: 'Legal Content',
          url: ROUTES.dashboardLegal.href,
          icon: IconFileText,
        },
        {
          title: 'Notices',
          url: ROUTES.dashboardNotices.href,
          icon: Megaphone,
        },
        {
          title: 'Help Center FAQs',
          url: ROUTES.dashboardHelpCenterFaqs.href,
          icon: IconHelp,
        },
      ],
    },

    // ============================================================================
    // USER MANAGEMENT
    // ============================================================================
    {
      title: 'User Management',
      items: [
        {
          title: 'Users',
          url: ROUTES.dashboardUsers.href,
          icon: IconUsers,
        },
        {
          title: 'Campaigns',
          url: ROUTES.dashboardCampaigns.href,
          icon: IconMail,
        },
        {
          title: 'Support Tickets',
          url: ROUTES.dashboardSupportTickets.href,
          icon: IconMessages,
        },
        {
          title: 'Contact Submissions',
          url: ROUTES.dashboardAdminContactSubmissions.href,
          icon: MessageSquare,
        },
      ],
    },

    // ============================================================================
    // MARKETPLACE
    // ============================================================================
    {
      title: 'Marketplace',
      items: [
        {
          title: 'Overview',
          url: ROUTES.dashboardMarketplace.href,
          icon: IconLayoutDashboard,
        },
        {
          title: 'My Posts',
          url: ROUTES.marketplacePosts.href,
          icon: ShoppingBag,
        },
        {
          title: 'Conversations',
          url: ROUTES.marketplaceConversations.href,
          icon: MessageSquare,
        },
        {
          title: 'Reviews',
          url: ROUTES.dashboardMarketplaceReviews.href,
          icon: IconStar,
        },
        {
          title: 'Analytics',
          url: ROUTES.marketplaceAnalytics.href,
          icon: IconBrowserCheck,
        },
      ],
    },

    // ============================================================================
    // PERSONAL
    // ============================================================================
    {
      title: 'Personal',
      items: [
        {
          title: 'My Library',
          url: ROUTES.libraryMyUploads.href,
          icon: IconLibrary,
        },
        {
          title: 'My Borrowed Books',
          url: ROUTES.profileLoans.href,
          icon: IconHandStop,
        },
        {
          title: 'Achievements',
          url: ROUTES.achievements.href,
          icon: IconTrophy,
        },
        {
          title: 'Moods',
          url: ROUTES.moods.href,
          icon: IconMoodSmile,
        },
      ],
    },

    // ============================================================================
    // SETTINGS
    // ============================================================================
    {
      title: 'Settings',
      items: [
        {
          title: 'Settings',
          icon: IconSettings,
          items: [
            {
              title: 'General',
              url: ROUTES.settings.href,
              icon: IconUserCog,
            },
            {
              title: 'Account',
              url: ROUTES.settingsAccount.href,
              icon: IconTool,
            },
            {
              title: 'Subscription',
              url: ROUTES.settingsSubscription.href,
              icon: IconCrown,
            },
            {
              title: 'Billing',
              url: ROUTES.settingsBilling.href,
              icon: IconReceipt,
            },
            {
              title: 'Appearance',
              url: ROUTES.settingsAppearance.href,
              icon: IconPalette,
            },
            {
              title: 'Notifications',
              url: ROUTES.settingsNotifications.href,
              icon: IconNotification,
            },
            {
              title: 'Display',
              url: ROUTES.settingsDisplay.href,
              icon: IconDeviceDesktop,
            },
          ],
        },
          {
              title: 'My Activity',
              url: ROUTES.dashboardActivity.href,
              icon: Activity,
          },
      ],
    },
  ],
}
