import {
  IconBarrierBlock,
  IconBook,
  IconBrowserCheck,
  IconBug,
  IconChecklist,
  IconError404,
  IconFileText,
  IconHelp,
  IconLock,
  IconLockAccess,
  IconMail,
  IconMessages,
  IconNotification,
  IconPackages,
  IconPalette,
  IconServerOff,
  IconTool,
  IconUserCog,
  IconUserOff,
  IconTag,
  IconBuildingStore,
  IconUser,
  IconBooks,
  IconBookmark,
  IconBuildingFactory,
  IconMoodSmile,
  IconList,
  IconShoppingCart,
  IconMessageCircle,
  IconStar,
  IconHistory,
  IconTrophy,
  IconHandStop,
  IconLibrary,
  IconCurrency,
  IconReceipt,
  IconCrown,
  IconLayoutDashboard,
  IconSettings,
} from '@tabler/icons-react'
import { AudioWaveform, BookOpen as BookOpenIcon, Brain, Command, GalleryVerticalEnd } from 'lucide-react'
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
    {
      title: 'General',
      items: [
        {
          title: ROUTES.dashboard.label,
          url: ROUTES.dashboard.href,
          icon: IconLayoutDashboard,
        },
        {
          title: ROUTES.siteSettings.label,
          url: ROUTES.siteSettings.href,
          icon: IconBuildingFactory,
        },
        {
          title: ROUTES.dashboardAdminContent.label,
          url: ROUTES.dashboardAdminContent.href,
          icon: IconCrown,
        },
        {
          title: ROUTES.dashboardUsers.label,
          url: ROUTES.dashboardUsers.href,
          icon: IconUser,
        },
        {
          title: ROUTES.dashboardCampaigns.label,
          url: ROUTES.dashboardCampaigns.href,
          icon: IconMail,
        },
        {
          title: ROUTES.dashboardNotices.label,
          url: ROUTES.dashboardNotices.href,
          icon: IconNotification,
        },
        {
          title: ROUTES.dashboardActivities.label,
          url: ROUTES.dashboardActivities.href,
          icon: IconHistory,
        },
        {
          title: ROUTES.dashboardSupportTickets.label,
          url: ROUTES.dashboardSupportTickets.href,
          icon: IconMessages,
        },
        {
          title: ROUTES.dashboardHelpCenterFaqs.label,
          url: ROUTES.dashboardHelpCenterFaqs.href,
          icon: IconHelp,
        },
        {
          title: ROUTES.dashboardAdminContactSubmissions.label,
          url: ROUTES.dashboardAdminContactSubmissions.href,
          icon: IconMessages,
        },
        {
          title: ROUTES.dashboardLegal.label,
          url: ROUTES.dashboardLegal.href,
          icon: IconFileText,
        },
      ],
    },
    {
      title: 'Library Management',
      items: [
        {
          title: ROUTES.dashboardBooks.label,
          url: ROUTES.dashboardBooks.href,
          icon: IconBook,
        },
        {
          title: ROUTES.dashboardSeries.label,
          url: ROUTES.dashboardSeries.href,
          icon: IconList,
        },
        {
          title: ROUTES.dashboardAuthors.label,
          url: ROUTES.dashboardAuthors.href,
          icon: IconUser,
        },
        {
          title: ROUTES.dashboardPublications.label,
          url: ROUTES.dashboardPublications.href,
          icon: IconBuildingStore,
        },
        {
          title: ROUTES.dashboardCategories.label,
          url: ROUTES.dashboardCategories.href,
          icon: IconTag,
        },
        {
          title: ROUTES.moods.label,
          url: ROUTES.moods.href,
          icon: IconMoodSmile,
        },
        {
          title: ROUTES.dashboardBookRequests.label,
          url: ROUTES.dashboardBookRequests.href,
          icon: IconBooks,
        },
        {
          title: ROUTES.dashboardLoans.label,
          url: ROUTES.dashboardLoans.href,
          icon: IconHandStop,
        },
        {
          title: ROUTES.dashboardBooksCostAnalytics.label,
          url: ROUTES.dashboardBooksCostAnalytics.href,
          icon: IconCurrency,
        },
      ],
    },
    {
      title: 'Marketplace',
      items: [
        {
          title: ROUTES.marketplace.label,
          url: ROUTES.marketplace.href,
          icon: IconShoppingCart,
        },
        {
          title: ROUTES.marketplaceMyPosts.label,
          url: ROUTES.marketplaceMyPosts.href,
          icon: IconBook,
        },
        {
          title: ROUTES.messagesSimple.label,
          url: ROUTES.messagesSimple.href,
          icon: IconMessageCircle,
        },
        {
          title: ROUTES.offersSent.label,
          url: ROUTES.offersSent.href,
          icon: IconTag,
        },
        {
          title: ROUTES.offersReceived.label,
          url: ROUTES.offersReceived.href,
          icon: IconTag,
        },
      ],
    },
    {
      title: 'Admin Marketplace',
      items: [
        {
          title: ROUTES.dashboardMarketplace.label,
          url: ROUTES.dashboardMarketplace.href,
          icon: IconLayoutDashboard,
        },
        {
          title: ROUTES.marketplacePosts.label,
          url: ROUTES.marketplacePosts.href,
          icon: IconBook,
        },
        {
          title: ROUTES.marketplaceConversations.label,
          url: ROUTES.marketplaceConversations.href,
          icon: IconMessages,
        },
        {
          title: ROUTES.dashboardMarketplaceReviews.label,
          url: ROUTES.dashboardMarketplaceReviews.href,
          icon: IconStar,
        },
        {
          title: ROUTES.marketplaceAnalytics.label,
          url: ROUTES.marketplaceAnalytics.href,
          icon: IconBrowserCheck,
        },
      ],
    },
    {
      title: 'Games',
      items: [
        {
          title: ROUTES.quiz.label,
          url: ROUTES.quiz.href,
          icon: Brain,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: ROUTES.dashboard.label,
          url: ROUTES.dashboard.href,
          icon: IconLayoutDashboard,
        },
        {
          title: ROUTES.physicalLibrary.label,
          url: ROUTES.physicalLibrary.href,
          icon: IconLibrary,
        },
        {
          title: ROUTES.libraryMyUploads.label,
          url: ROUTES.libraryMyUploads.href,
          icon: IconBookmark,
        },
        {
          title: ROUTES.profileLoans.label,
          url: ROUTES.profileLoans.href,
          icon: IconHandStop,
        },
        {
          title: ROUTES.dashboardActivity.label,
          url: ROUTES.dashboardActivity.href,
          icon: IconHistory,
        },
        {
          title: ROUTES.achievements.label,
          url: ROUTES.achievements.href,
          icon: IconTrophy,
        },
        {
          title: ROUTES.settings.label,
          icon: IconSettings,
          items: [
            {
              title: ROUTES.settings.label,
              url: ROUTES.settings.href,
              icon: IconUserCog,
            },
            {
              title: ROUTES.settingsAccount.label,
              url: ROUTES.settingsAccount.href,
              icon: IconTool,
            },
            {
              title: ROUTES.settingsSubscription.label,
                url: ROUTES.settingsSubscription.href,
                icon: IconCrown,
            },
            {
                title: ROUTES.settingsBilling.label,
                url: ROUTES.settingsBilling.href,
                icon: IconReceipt,
            },
            {
              title: ROUTES.settingsAppearance.label,
              url: ROUTES.settingsAppearance.href,
              icon: IconPalette,
            },
            {
              title: ROUTES.settingsNotifications.label,
              url: ROUTES.settingsNotifications.href,
              icon: IconNotification,
            },
            {
              title: ROUTES.settingsDisplay.label,
              url: ROUTES.settingsDisplay.href,
              icon: IconBrowserCheck,
            },
          ],
        },
        {
          title: ROUTES.pricing.label,
          url: ROUTES.pricing.href,
          icon: IconCrown,
        },
        {
          title: ROUTES.helpCenter.label,
          url: ROUTES.helpCenter.href,
          icon: IconHelp,
        },
      ],
    },
  ],
}
