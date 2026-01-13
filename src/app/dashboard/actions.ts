'use server'

import { prisma } from '@/lib/prisma'

// ============================================================================
// OVERVIEW CHART DATA
// ============================================================================

export async function getOverviewData() {
  const now = new Date()
  const months: string[] = []
  const data: number[] = []

  // Get data for the last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = date.toLocaleString('default', { month: 'short' })

    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

    // Count views in this month
    const views = await prisma.bookView.count({
      where: {
        visitedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    })

    months.push(monthName)
    data.push(views)
  }

  return months.map((name, i) => ({ name, total: data[i] }))
}

// ============================================================================
// ANALYTICS DATA
// ============================================================================

export interface AnalyticsData {
  totalViews: number
  uniqueVisitors: number
  topBooks: Array<{ id: string; name: string; views: number }>
  topCategories: Array<{ id: string; name: string; views: number }>
  viewsOverTime: Array<{ date: string; views: number }>
  userEngagement: {
    avgReadingProgress: number
    activeReaders: number
    totalBooksCompleted: number
  }
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalViews,
    uniqueVisitors,
    topBooks,
    topCategories,
    viewsOverTime,
    readingProgress,
  ] = await Promise.all([
    // Total views in last 30 days
    prisma.bookView.count({
      where: { visitedAt: { gte: thirtyDaysAgo } },
    }),

    // Unique visitors
    prisma.bookView.groupBy({
      by: ['userId'],
      where: { visitedAt: { gte: thirtyDaysAgo }, userId: { not: null } },
    }).then(groups => groups.length),

    // Top viewed books
    prisma.bookView.groupBy({
      by: ['bookId'],
      where: { visitedAt: { gte: thirtyDaysAgo } },
      _count: { bookId: true },
      orderBy: { _count: { bookId: 'desc' } },
      take: 5,
    }).then(async (groups) => {
      const books = await prisma.book.findMany({
        where: { id: { in: groups.map(g => g.bookId) } },
        select: { id: true, name: true },
      })
      return groups.map(g => ({
        id: g.bookId,
        name: books.find(b => b.id === g.bookId)?.name || 'Unknown',
        views: g._count.bookId,
      }))
    }),

    // Top categories by views
    prisma.categoryView.groupBy({
      by: ['categoryId'],
      where: { visitedAt: { gte: thirtyDaysAgo } },
      _count: { categoryId: true },
      orderBy: { _count: { categoryId: 'desc' } },
      take: 5,
    }).then(async (groups) => {
      const categories = await prisma.category.findMany({
        where: { id: { in: groups.map(g => g.categoryId) } },
        select: { id: true, name: true },
      })
      return groups.map(g => ({
        id: g.categoryId,
        name: categories.find(c => c.id === g.categoryId)?.name || 'Unknown',
        views: g._count.categoryId,
      }))
    }),

    // Views over time (last 7 days)
    prisma.bookView.findMany({
      where: { visitedAt: { gte: thirtyDaysAgo } },
      select: { visitedAt: true },
    }).then(views => {
      const dailyViews = new Map<string, number>()
      views.forEach(v => {
        const date = v.visitedAt.toISOString().split('T')[0]
        dailyViews.set(date, (dailyViews.get(date) || 0) + 1)
      })
      return Array.from(dailyViews.entries()).map(([date, views]) => ({ date, views }))
    }),

    // Reading progress stats
    prisma.readingProgress.findMany({
      select: { progress: true, isCompleted: true },
    }).then(progress => {
      const avgReadingProgress = progress.reduce((sum, p) => sum + p.progress, 0) / (progress.length || 1)
      const activeReaders = progress.filter(p => !p.isCompleted && p.progress > 0).length
      const completedBooks = progress.filter(p => p.isCompleted).length
      return { avgReadingProgress, activeReaders, totalBooksCompleted: completedBooks }
    }),
  ])

  return {
    totalViews,
    uniqueVisitors,
    topBooks,
    topCategories,
    viewsOverTime,
    userEngagement: readingProgress,
  }
}

// ============================================================================
// REPORTS DATA
// ============================================================================

export interface ReportData {
  booksByType: Array<{ type: string; count: number }>
  booksByStatus: Array<{ status: string; count: number }>
  loansByStatus: Array<{ status: string; count: number }>
  userActivity: Array<{ action: string; count: number }>
  systemHealth: {
    totalBooks: number
    totalUsers: number
    totalLoans: number
    errorRate: number
  }
}

export async function getReportData(): Promise<ReportData> {
  const [
    booksByType,
    loansByStatus,
    userActivity,
    systemHealth,
  ] = await Promise.all([
    // Books by type
    prisma.book.groupBy({
      by: ['type'],
      _count: { type: true },
    }).then(groups => groups.map(g => ({ type: g.type, count: g._count.type }))),

    // Loans by status
    prisma.bookLoan.groupBy({
      by: ['status'],
      _count: { status: true },
    }).then(groups => groups.map(g => ({ status: g.status, count: g._count.status }))),

    // User activity
    prisma.activityLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    }).then(groups => groups.map(g => ({ action: g.action, count: g._count.action }))),

    // System health
    Promise.all([
      prisma.book.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.bookLoan.count(),
    ]).then(([totalBooks, totalUsers, totalLoans]) => ({
      totalBooks,
      totalUsers,
      totalLoans,
      errorRate: 0, // Could calculate from activity logs
    })),
  ])

  return {
    booksByType,
    booksByStatus: [
      { status: 'Public', count: systemHealth.totalBooks }, // Simplified
      { status: 'Private', count: 0 },
    ],
    loansByStatus,
    userActivity,
    systemHealth,
  }
}

// ============================================================================
// NOTIFICATIONS DATA
// ============================================================================

export interface NotificationData {
  unread: number
  notifications: Array<{
    id: string
    type: 'info' | 'warning' | 'success' | 'error'
    title: string
    message: string
    createdAt: Date
  }>
}

export async function getNotificationData(): Promise<NotificationData> {
  const notifications = await prisma.notification.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      isRead: true,
      createdAt: true,
    },
  })

  return {
    unread: notifications.filter(n => !n.isRead).length,
    notifications: notifications.map(n => ({
      id: n.id,
      type: n.type.toLowerCase() as any,
      title: n.title,
      message: n.message.substring(0, 200) + (n.message.length > 200 ? '...' : ''),
      createdAt: n.createdAt,
    })),
  }
}

// ============================================================================
// ADMIN DASHBOARD STATS
// ============================================================================

export interface AdminDashboardStats {
  totalBooks: number
  totalUsers: number
  totalAuthors: number
  totalPublications: number
  totalCategories: number
  publicBooks: number
  premiumBooks: number
  totalViews: number
  totalChatMessages: number
  activeLoans: number
  overdueLoans: number
  booksThisMonth: number
  usersThisMonth: number
  viewsThisMonth: number
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalBooks,
    totalUsers,
    totalAuthors,
    totalPublications,
    totalCategories,
    publicBooks,
    premiumBooks,
    totalViews,
    totalChatMessages,
    activeLoans,
    overdueLoans,
    booksThisMonth,
    usersThisMonth,
    viewsThisMonth,
  ] = await Promise.all([
    // Total counts
    prisma.book.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.author.count(),
    prisma.publication.count(),
    prisma.category.count(),

    // Book stats
    prisma.book.count({ where: { isPublic: true } }),
    prisma.book.count({ where: { requiresPremium: true } }),

    // Analytics
    prisma.bookView.count(),
    prisma.bookChatMessage.count(),

    // Lending stats
    prisma.bookLoan.count({ where: { status: 'ACTIVE' } }),
    prisma.bookLoan.count({ where: { status: 'OVERDUE' } }),

    // This month stats
    prisma.book.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth }, isActive: true } }),
    prisma.bookView.count({ where: { visitedAt: { gte: startOfMonth } } }),
  ])

  return {
    totalBooks,
    totalUsers,
    totalAuthors,
    totalPublications,
    totalCategories,
    publicBooks,
    premiumBooks,
    totalViews,
    totalChatMessages,
    activeLoans,
    overdueLoans,
    booksThisMonth,
    usersThisMonth,
    viewsThisMonth,
  }
}

export interface RecentActivity {
  id: string
  type: 'book' | 'user' | 'loan' | 'view'
  action: string
  description: string
  createdAt: Date
  user?: {
    name: string
    avatar?: string | null
  } | null
}

export async function getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = []

  try {
    // Get recent books
    const recentBooks = await prisma.book.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        entryBy: {
          select: { name: true, avatar: true, directAvatarUrl: true },
        },
      },
    })

    for (const book of recentBooks) {
      activities.push({
        id: `book-${book.id}`,
        type: 'book',
        action: 'Book Added',
        description: `New book "${book.name}" was added`,
        createdAt: book.createdAt,
        user: book.entryBy ? {
          name: book.entryBy.name,
          avatar: book.entryBy.directAvatarUrl || book.entryBy.avatar,
        } : null,
      })
    }

    // Get recent loans
    const recentLoans = await prisma.bookLoan.findMany({
      take: 4,
      orderBy: { loanDate: 'desc' },
      select: {
        id: true,
        loanDate: true,
        status: true,
        book: {
          select: { name: true },
        },
        user: {
          select: { name: true, avatar: true, directAvatarUrl: true },
        },
        lentBy: {
          select: { name: true },
        },
      },
    })

    for (const loan of recentLoans) {
      activities.push({
        id: `loan-${loan.id}`,
        type: 'loan',
        action: `Book ${loan.status === 'ACTIVE' ? 'Lent' : loan.status === 'OVERDUE' ? 'Overdue' : loan.status}`,
        description: `"${loan.book.name}" borrowed by ${loan.user.name}`,
        createdAt: loan.loanDate,
        user: loan.lentBy ? {
          name: loan.lentBy.name,
          avatar: null,
        } : null,
      })
    }

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      take: 4,
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    })

    for (const user of recentUsers) {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        action: 'New User',
        description: `User "${user.name}" joined`,
        createdAt: user.createdAt,
        user: null,
      })
    }

    // Get recent views
    const recentViews = await prisma.bookView.findMany({
      take: 4,
      orderBy: { visitedAt: 'desc' },
      select: {
        id: true,
        visitedAt: true,
        bookId: true,
        userId: true,
      },
    })

    // Get book names for the views
    const bookIds = [...new Set(recentViews.map(v => v.bookId))]
    const books = await prisma.book.findMany({
      where: { id: { in: bookIds } },
      select: { id: true, name: true },
    })

    for (const view of recentViews) {
      const book = books.find(b => b.id === view.bookId)
      if (!book) continue

      activities.push({
        id: `view-${view.id}`,
        type: 'view',
        action: 'Book Viewed',
        description: `"${book.name}" was viewed`,
        createdAt: view.visitedAt,
        user: null,
      })
    }

    // Sort by date and limit
    return activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
}

// ============================================================================
// USER DASHBOARD STATS
// ============================================================================

export interface UserDashboardStats {
  totalBooks: number
  booksRead: number
  currentlyReading: number
  readingProgress: number
  totalReadingTime: number // in hours
  totalPagesRead: number
  achievements: number
  borrowedBooks: number
}

export async function getUserDashboardStats(userId: string): Promise<UserDashboardStats> {
  const [
    totalBooks,
    readingProgress,
    achievements,
    borrowedBooks,
  ] = await Promise.all([
    // Total public books available
    prisma.book.count({ where: { isPublic: true } }),

    // User's reading progress
    prisma.readingProgress.findMany({
      where: { userId },
      select: {
        progress: true,
        isCompleted: true,
        book: {
          select: { pageNumber: true },
        },
      },
    }),

    // User's achievements
    prisma.userAchievement.count({ where: { userId } }),

    // User's borrowed books
    prisma.bookLoan.count({
      where: {
        userId,
        status: { in: ['ACTIVE', 'OVERDUE'] },
      },
    }),
  ])

  // Calculate stats from reading progress
  const booksRead = readingProgress.filter(rp => rp.isCompleted).length
  const currentlyReading = readingProgress.filter(
    rp => !rp.isCompleted && rp.progress > 0
  ).length

  const totalProgress = readingProgress.reduce((sum, rp) => sum + rp.progress, 0)
  const avgProgress = readingProgress.length > 0 ? totalProgress / readingProgress.length : 0

  const totalPagesRead = readingProgress.reduce((sum, rp) => {
    return sum + Math.floor((rp.progress / 100) * (rp.book.pageNumber || 0))
  }, 0)

  // Estimate reading time (2 minutes per page)
  const totalReadingTime = Math.floor(totalPagesRead * 2 / 60)

  return {
    totalBooks,
    booksRead,
    currentlyReading,
    readingProgress: Math.round(avgProgress),
    totalReadingTime,
    totalPagesRead,
    achievements,
    borrowedBooks,
  }
}

export interface RecentlyViewedBook {
  id: string
  name: string
  image?: string | null
  directImageUrl?: string | null
  authors: { name: string }[]
  pageNumber?: number | null
  lastViewedAt: Date
}

export async function getRecentlyViewedBooks(userId: string, limit: number = 5) {
  const recentViews = await prisma.bookView.findMany({
    where: { userId },
    orderBy: { visitedAt: 'desc' },
    take: limit,
    select: {
      bookId: true,
      visitedAt: true,
    },
  })

  // Get book IDs
  const bookIds = [...new Set(recentViews.map(v => v.bookId))]

  // Get books with authors
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: {
      id: true,
      name: true,
      image: true,
      directImageUrl: true,
      pageNumber: true,
      authors: {
        select: {
          author: {
            select: { name: true },
          },
        },
      },
    },
  })

  // Map to simpler structure
  const simplifiedBooks = books.map(book => ({
    ...book,
    authors: book.authors.map(a => ({ name: a.author.name })),
  }))

  // Map views to books
  return recentViews
    .map(view => {
      const book = simplifiedBooks.find(b => b.id === view.bookId)
      if (!book) return null
      return {
        ...book,
        lastViewedAt: view.visitedAt,
      } as RecentlyViewedBook
    })
    .filter((book): book is RecentlyViewedBook => book !== null)
    .slice(0, limit)
}

export interface PopularBook {
  id: string
  name: string
  image?: string | null
  directImageUrl?: string | null
  authors: { name: string }[]
  viewCount: number
}

export async function getPopularBooks(limit: number = 6) {
  const books = await prisma.book.findMany({
    where: { isPublic: true },
    take: limit,
    orderBy: {
      views: { _count: 'desc' },
    },
    select: {
      id: true,
      name: true,
      image: true,
      directImageUrl: true,
      authors: {
        select: {
          author: {
            select: { name: true },
          },
        },
      },
      _count: {
        select: { views: true },
      },
    },
  })

  return books.map(book => ({
    id: book.id,
    name: book.name,
    image: book.image,
    directImageUrl: book.directImageUrl,
    authors: book.authors.map(a => ({ name: a.author.name })),
    viewCount: book._count.views,
  }))
}

// Legacy export for RecentSales component
export async function getRecentSales() {
  // Return empty array for now - this component is not used in the dashboard
  return []
}
