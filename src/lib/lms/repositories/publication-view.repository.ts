/**
 * Publication View Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the PublicationView model
 */

import { prisma } from '../../prisma'

// ============================================================================
// PUBLICATION VIEW QUERIES
// ============================================================================

/**
 * Create a publication view record
 */
export async function createPublicationView(data: {
  publicationId: string
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  referrer?: string
}) {
  return await prisma.publicationView.create({
    data,
  })
}

/**
 * Get all views for a publication with pagination and filtering
 */
export async function getPublicationViews(publicationId: string, options: {
  page?: number
  limit?: number
  startDate?: Date
  endDate?: Date
  userId?: string
} = {}) {
  const { page = 1, limit = 50, startDate, endDate, userId } = options
  const skip = (page - 1) * limit

  const where: any = { publicationId }

  if (startDate || endDate) {
    where.visitedAt = {}
    if (startDate) where.visitedAt.gte = startDate
    if (endDate) where.visitedAt.lte = endDate
  }

  if (userId) {
    where.userId = userId
  }

  const [views, total] = await Promise.all([
    prisma.publicationView.findMany({
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
    prisma.publicationView.count({ where }),
  ])

  return {
    views,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

/**
 * Get aggregate view statistics for a publication
 */
export async function getPublicationViewStats(publicationId: string) {
  const [totalViews, uniqueVisitors, viewsThisMonth] = await Promise.all([
    prisma.publicationView.count({ where: { publicationId } }),

    prisma.publicationView.groupBy({
      by: ['userId'],
      where: { publicationId },
    }).then(groups => groups.length),

    prisma.publicationView.count({
      where: {
        publicationId,
        visitedAt: {
          gte: new Date(new Date().setDate(1)), // First day of current month
        },
      },
    }),
  ])

  // Calculate average views per day (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const viewsLast30Days = await prisma.publicationView.count({
    where: {
      publicationId,
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
export async function getPublicationViewsByDate(
  publicationId: string,
  startDate: Date,
  endDate: Date
) {
  const views = await prisma.publicationView.groupBy({
    by: ['visitedAt'],
    where: {
      publicationId,
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
 * Get most viewed publications in the last N days
 */
export async function getPopularPublications(options: {
  limit?: number
  days?: number
} = {}) {
  const { limit = 10, days = 30 } = options

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const publications = await prisma.publicationView.groupBy({
    by: ['publicationId'],
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

  // Fetch publication details
  const publicationIds = publications.map(p => p.publicationId)
  const publicationDetails = await prisma.publication.findMany({
    where: { id: { in: publicationIds } },
    select: {
      id: true,
      name: true,
      image: true,
      directImageUrl: true,
    },
  })

  return publications.map(publication => {
    const details = publicationDetails.find(p => p.id === publication.publicationId)!
    return {
      ...details,
      viewCount: publication._count.id,
    }
  })
}

/**
 * Get recent views for a publication
 */
export async function getRecentPublicationViews(publicationId: string, limit = 10) {
  return await prisma.publicationView.findMany({
    where: { publicationId },
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
