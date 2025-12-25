/**
 * Author View Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the AuthorView model
 */

import { prisma } from '../../prisma'

// ============================================================================
// AUTHOR VIEW QUERIES
// ============================================================================

/**
 * Create an author view record
 */
export async function createAuthorView(data: {
  authorId: string
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  referrer?: string
}) {
  return await prisma.authorView.create({
    data,
  })
}

/**
 * Get all views for an author with pagination and filtering
 */
export async function getAuthorViews(authorId: string, options: {
  page?: number
  limit?: number
  startDate?: Date
  endDate?: Date
  userId?: string
} = {}) {
  const { page = 1, limit = 50, startDate, endDate, userId } = options
  const skip = (page - 1) * limit

  const where: any = { authorId }

  if (startDate || endDate) {
    where.visitedAt = {}
    if (startDate) where.visitedAt.gte = startDate
    if (endDate) where.visitedAt.lte = endDate
  }

  if (userId) {
    where.userId = userId
  }

  const [views, total] = await Promise.all([
    prisma.authorView.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            directAvatarUrl: true,
          },
        },
      },
      orderBy: { visitedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.authorView.count({ where }),
  ])

  return {
    views,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

/**
 * Get aggregate view statistics for an author
 */
export async function getAuthorViewStats(authorId: string) {
  const [totalViews, uniqueVisitors, viewsThisMonth] = await Promise.all([
    prisma.authorView.count({ where: { authorId } }),

    prisma.authorView.groupBy({
      by: ['userId'],
      where: { authorId },
    }).then(groups => groups.length),

    prisma.authorView.count({
      where: {
        authorId,
        visitedAt: {
          gte: new Date(new Date().setDate(1)), // First day of current month
        },
      },
    }),
  ])

  // Calculate average views per day (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const viewsLast30Days = await prisma.authorView.count({
    where: {
      authorId,
      visitedAt: { gte: thirtyDaysAgo },
    },
  })

  const avgViewsPerDay = viewsLast30Days / 30

  return {
    totalViews,
    uniqueVisitors,
    viewsThisMonth,
    avgViewsPerDay: Math.round(avgViewsPerDay * 100) / 100,
  }
}

/**
 * Get views grouped by date for charts
 */
export async function getAuthorViewsByDate(
  authorId: string,
  startDate: Date,
  endDate: Date
) {
  const views = await prisma.authorView.groupBy({
    by: ['visitedAt'],
    where: {
      authorId,
      visitedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      visitedAt: 'asc',
    },
  })

  // Group by day
  const viewsByDay = new Map<string, number>()

  views.forEach(view => {
    const date = view.visitedAt.toISOString().split('T')[0]
    viewsByDay.set(date, (viewsByDay.get(date) || 0) + 1)
  })

  // Fill in missing dates with 0
  const dates: string[] = []
  const counts: number[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    dates.push(dateStr)
    counts.push(viewsByDay.get(dateStr) || 0)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return {
    dates,
    counts,
  }
}

/**
 * Get most viewed authors in the last N days
 */
export async function getPopularAuthors(options: {
  limit?: number
  days?: number
} = {}) {
  const { limit = 10, days = 30 } = options

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const authors = await prisma.authorView.groupBy({
    by: ['authorId'],
    where: {
      visitedAt: {
        gte: startDate,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: limit,
  })

  // Fetch author details
  const authorIds = authors.map(a => a.authorId)
  const authorDetails = await prisma.author.findMany({
    where: { id: { in: authorIds } },
    select: {
      id: true,
      name: true,
      image: true,
      directImageUrl: true,
    },
  })

  return authors.map(author => {
    const details = authorDetails.find(a => a.id === author.authorId)!
    return {
      ...details,
      viewCount: author._count.id,
    }
  })
}

/**
 * Get recent views for an author
 */
export async function getRecentAuthorViews(authorId: string, limit = 10) {
  return await prisma.authorView.findMany({
    where: { authorId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          directAvatarUrl: true,
        },
      },
    },
    orderBy: { visitedAt: 'desc' },
    take: limit,
  })
}
