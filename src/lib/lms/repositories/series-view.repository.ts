/**
 * Series View Repository
 *
 * Handles analytics and view tracking for series
 */

import { prisma } from '../../prisma'

/**
 * Create series view (track visit)
 */
export async function createSeriesView(data: {
  seriesId: string
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  referrer?: string
}) {
  return prisma.seriesView.create({
    data,
  })
}

/**
 * Get series analytics
 */
export async function getSeriesAnalytics(seriesId: string) {
  const [totalViews, uniqueVisitors] = await Promise.all([
    prisma.seriesView.count({
      where: { seriesId },
    }),
    prisma.seriesView.groupBy({
      by: ['userId'],
      where: {
        seriesId,
        userId: { not: null },
      },
    }).then(groups => groups.length),
  ])

  return {
    totalViews,
    uniqueVisitors,
  }
}

/**
 * Get series views over time
 */
export async function getSeriesViewsOverTime(seriesId: string, days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const views = await prisma.seriesView.findMany({
    where: {
      seriesId,
      visitedAt: {
        gte: startDate,
      },
    },
    select: {
      visitedAt: true,
    },
    orderBy: {
      visitedAt: 'asc',
    },
  })

  // Group by date
  const viewsByDate: Record<string, number> = {}
  views.forEach(view => {
    const date = view.visitedAt.toISOString().split('T')[0]
    viewsByDate[date] = (viewsByDate[date] || 0) + 1
  })

  return Object.entries(viewsByDate).map(([date, count]) => ({
    date,
    count,
  }))
}
