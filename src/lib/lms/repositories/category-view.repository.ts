/**
 * Category View Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the CategoryView model
 */

import { prisma } from '../../prisma'

// ============================================================================
// CATEGORY VIEW QUERIES
// ============================================================================

/**
 * Create a category view record
 */
export async function createCategoryView(data: {
  categoryId: string
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  referrer?: string
}) {
  return await prisma.categoryView.create({
    data,
  })
}

/**
 * Get all views for a category with pagination and filtering
 */
export async function getCategoryViews(categoryId: string, options: {
  page?: number
  limit?: number
  startDate?: Date
  endDate?: Date
  userId?: string
} = {}) {
  const { page = 1, limit = 50, startDate, endDate, userId } = options
  const skip = (page - 1) * limit

  const where: any = { categoryId }

  if (startDate || endDate) {
    where.visitedAt = {}
    if (startDate) where.visitedAt.gte = startDate
    if (endDate) where.visitedAt.lte = endDate
  }

  if (userId) {
    where.userId = userId
  }

  const [views, total] = await Promise.all([
    prisma.categoryView.findMany({
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
    prisma.categoryView.count({ where }),
  ])

  return {
    views,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

/**
 * Get aggregate view statistics for a category
 */
export async function getCategoryViewStats(categoryId: string) {
  const [totalViews, uniqueVisitors, viewsThisMonth] = await Promise.all([
    prisma.categoryView.count({ where: { categoryId } }),

    prisma.categoryView.groupBy({
      by: ['userId'],
      where: { categoryId },
    }).then(groups => groups.length),

    prisma.categoryView.count({
      where: {
        categoryId,
        visitedAt: {
          gte: new Date(new Date().setDate(1)), // First day of current month
        },
      },
    }),
  ])

  // Calculate average views per day (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const viewsLast30Days = await prisma.categoryView.count({
    where: {
      categoryId,
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
export async function getCategoryViewsByDate(
  categoryId: string,
  startDate: Date,
  endDate: Date
) {
  const views = await prisma.categoryView.groupBy({
    by: ['visitedAt'],
    where: {
      categoryId,
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
 * Get most viewed categories in the last N days
 */
export async function getPopularCategories(options: {
  limit?: number
  days?: number
} = {}) {
  const { limit = 10, days = 30 } = options

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const categories = await prisma.categoryView.groupBy({
    by: ['categoryId'],
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

  // Fetch category details
  const categoryIds = categories.map(c => c.categoryId)
  const categoryDetails = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: {
      id: true,
      name: true,
      image: true,
      directImageUrl: true,
    },
  })

  return categories.map(category => {
    const details = categoryDetails.find(c => c.id === category.categoryId)!
    return {
      ...details,
      viewCount: category._count.id,
    }
  })
}

/**
 * Get recent views for a category
 */
export async function getRecentCategoryViews(categoryId: string, limit = 10) {
  return await prisma.categoryView.findMany({
    where: { categoryId },
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
