/**
 * Book Cost Analytics Repository
 *
 * Repository Pattern for all cost analytics operations
 * Handles data aggregation, cost calculations, and filtering by user/admin access
 */

import { prisma } from '@/lib/prisma'
import { BookType } from '@prisma/client'
import type {
  CostSummary,
  CostOverTimeData,
  CostByDimensionData,
  TopCostItem,
  CostActivitySummary,
  CostDetailItem,
  GroupByType,
  TimePeriodGrouping,
} from '@/types/book-cost-analytics'

// ============================================================================
// SUMMARY STATISTICS
// ============================================================================

/**
 * Get overall cost statistics
 * @param userId - User ID for filtering (undefined for admin view of all books)
 */
export async function getCostSummary(
  userId?: string
): Promise<CostSummary> {
  const where = buildWhereClause(userId)

  const [
    totalBooks,
    totalSpentResult,
    hardCopyStats,
    mostExpensiveResult,
    leastExpensiveResult
  ] = await Promise.all([
    // Count total books
    prisma.book.count({ where }),

    // Sum total spent (HARD_COPY only)
    prisma.book.aggregate({
      where: { ...where, type: BookType.HARD_COPY },
      _sum: { buyingPrice: true }
    }),

    // Hard copy specific stats
    prisma.book.aggregate({
      where: { ...where, type: BookType.HARD_COPY },
      _count: { id: true },
      _sum: { buyingPrice: true }
    }),

    // Most expensive book
    prisma.book.findFirst({
      where: { ...where, type: BookType.HARD_COPY },
      orderBy: { buyingPrice: 'desc' },
      select: { buyingPrice: true }
    }),

    // Least expensive book
    prisma.book.findFirst({
      where: { ...where, type: BookType.HARD_COPY, buyingPrice: { not: null } },
      orderBy: { buyingPrice: 'asc' },
      select: { buyingPrice: true }
    })
  ])

  const totalSpent = totalSpentResult._sum.buyingPrice || 0
  const hardCopySpent = hardCopyStats._sum.buyingPrice || 0

  return {
    totalBooks,
    totalSpent,
    averageCostPerBook: totalBooks > 0 ? totalSpent / totalBooks : 0,
    hardCopyCount: hardCopyStats._count.id,
    hardCopySpent,
    averageHardCopyCost: hardCopyStats._count.id > 0
      ? hardCopySpent / hardCopyStats._count.id
      : 0,
    mostExpensiveBook: mostExpensiveResult?.buyingPrice || 0,
    leastExpensiveBook: leastExpensiveResult?.buyingPrice || 0
  }
}

// ============================================================================
// COSTS OVER TIME
// ============================================================================

/**
 * Get costs grouped by time period
 * @param userId - User ID for filtering (undefined for admin view)
 * @param days - Number of days to look back (0 for all time)
 * @param grouping - Time period grouping (daily, weekly, monthly, yearly)
 */
export async function getCostsOverTime(
  userId: string | undefined,
  days: number = 30,
  grouping: TimePeriodGrouping = 'daily'
): Promise<CostOverTimeData[]> {
  const startDate = days > 0 ? getDateDaysAgo(days) : undefined
  const where = buildWhereClause(userId, startDate ? { startDate } : undefined)

  // Get all hard copy books with purchase dates
  const books = await prisma.book.findMany({
    where: {
      ...where,
      type: BookType.HARD_COPY,
      purchaseDate: { not: null }
    },
    select: {
      purchaseDate: true,
      buyingPrice: true,
      numberOfCopies: true
    },
    orderBy: { purchaseDate: 'asc' }
  })

  // Group by time period
  const grouped = groupBooksByTimePeriod(books, grouping)

  // Convert to array format
  return Object.entries(grouped)
    .map(([period, data]) => ({
      period,
      displayPeriod: formatPeriodLabel(period, grouping),
      totalCost: data.totalCost,
      bookCount: data.count,
      averageCost: data.count > 0 ? data.totalCost / data.count : 0
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

// ============================================================================
// COSTS BY DIMENSION
// ============================================================================

/**
 * Get costs grouped by category, author, or publication
 * @param userId - User ID for filtering (undefined for admin view)
 * @param groupBy - Dimension to group by
 * @param limit - Maximum number of results
 */
export async function getCostsByDimension(
  userId: string | undefined,
  groupBy: GroupByType,
  limit: number = 20
): Promise<CostByDimensionData[]> {
  const where = buildWhereClause(userId)

  if (groupBy === 'category') {
    return await getCostsByCategory(where, limit)
  } else if (groupBy === 'author') {
    return await getCostsByAuthor(where, limit)
  } else if (groupBy === 'publication') {
    return await getCostsByPublication(where, limit)
  } else if (groupBy === 'timePeriod') {
    return await getCostsByTimePeriod(userId, where, limit)
  }

  return []
}

/**
 * Get costs grouped by category
 */
async function getCostsByCategory(where: any, limit: number): Promise<CostByDimensionData[]> {
  const books = await prisma.book.findMany({
    where: { ...where, type: BookType.HARD_COPY },
    select: {
      buyingPrice: true,
      numberOfCopies: true,
      categories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
              image: true,
              directImageUrl: true
            }
          }
        }
      }
    }
  })

  // Group and aggregate by category
  const categoryMap = new Map<string, any>()

  books.forEach(book => {
    book.categories.forEach(({ category }) => {
      const cost = calculateBookCost(book.buyingPrice, book.numberOfCopies)
      const existing = categoryMap.get(category.id)

      if (existing) {
        existing.totalCost += cost
        existing.bookCount += 1
      } else {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          totalCost: cost,
          bookCount: 1,
          category: {
            id: category.id,
            name: category.name,
            image: category.image,
            directImageUrl: category.directImageUrl
          }
        })
      }
    })
  })

  return Array.from(categoryMap.values())
    .map(item => ({
      ...item,
      averageCost: item.bookCount > 0 ? item.totalCost / item.bookCount : 0
    }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, limit)
}

/**
 * Get costs grouped by author
 */
async function getCostsByAuthor(where: any, limit: number): Promise<CostByDimensionData[]> {
  const books = await prisma.book.findMany({
    where: { ...where, type: BookType.HARD_COPY },
    select: {
      buyingPrice: true,
      numberOfCopies: true,
      authors: {
        select: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              directImageUrl: true
            }
          }
        }
      }
    }
  })

  const authorMap = new Map<string, any>()

  books.forEach(book => {
    book.authors.forEach(({ author }) => {
      const cost = calculateBookCost(book.buyingPrice, book.numberOfCopies)
      const existing = authorMap.get(author.id)

      if (existing) {
        existing.totalCost += cost
        existing.bookCount += 1
      } else {
        authorMap.set(author.id, {
          id: author.id,
          name: author.name,
          totalCost: cost,
          bookCount: 1,
          author: {
            id: author.id,
            name: author.name,
            image: author.image,
            directImageUrl: author.directImageUrl
          }
        })
      }
    })
  })

  return Array.from(authorMap.values())
    .map(item => ({
      ...item,
      averageCost: item.bookCount > 0 ? item.totalCost / item.bookCount : 0
    }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, limit)
}

/**
 * Get costs grouped by publication
 */
async function getCostsByPublication(where: any, limit: number): Promise<CostByDimensionData[]> {
  const books = await prisma.book.findMany({
    where: { ...where, type: BookType.HARD_COPY },
    select: {
      buyingPrice: true,
      numberOfCopies: true,
      publications: {
        select: {
          publication: {
            select: {
              id: true,
              name: true,
              image: true,
              directImageUrl: true
            }
          }
        }
      }
    }
  })

  const publicationMap = new Map<string, any>()

  books.forEach(book => {
    book.publications.forEach(({ publication }) => {
      const cost = calculateBookCost(book.buyingPrice, book.numberOfCopies)
      const existing = publicationMap.get(publication.id)

      if (existing) {
        existing.totalCost += cost
        existing.bookCount += 1
      } else {
        publicationMap.set(publication.id, {
          id: publication.id,
          name: publication.name,
          totalCost: cost,
          bookCount: 1,
          publication: {
            id: publication.id,
            name: publication.name,
            image: publication.image,
            directImageUrl: publication.directImageUrl
          }
        })
      }
    })
  })

  return Array.from(publicationMap.values())
    .map(item => ({
      ...item,
      averageCost: item.bookCount > 0 ? item.totalCost / item.bookCount : 0
    }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, limit)
}

/**
 * Get costs grouped by time period
 */
async function getCostsByTimePeriod(
  userId: string | undefined,
  where: any,
  limit: number
): Promise<CostByDimensionData[]> {
  const timeData = await getCostsOverTime(userId, 365, 'monthly')

  return timeData
    .map(item => ({
      id: item.period,
      name: item.displayPeriod,
      totalCost: item.totalCost,
      bookCount: item.bookCount,
      averageCost: item.averageCost
    }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, limit)
}

// ============================================================================
// TOP COSTS
// ============================================================================

/**
 * Get top costs by individual books
 * @param userId - User ID for filtering (undefined for admin view)
 * @param limit - Maximum number of results
 */
export async function getTopCosts(
  userId: string | undefined,
  limit: number = 10
): Promise<TopCostItem[]> {
  const where = buildWhereClause(userId)

  const books = await prisma.book.findMany({
    where: { ...where, type: BookType.HARD_COPY },
    select: {
      id: true,
      name: true,
      type: true,
      buyingPrice: true,
      numberOfCopies: true,
      purchaseDate: true,
      image: true,
      directImageUrl: true
    },
    orderBy: { buyingPrice: 'desc' },
    take: limit
  })

  return books.map(book => ({
    bookId: book.id,
    bookName: book.name,
    bookType: book.type,
    totalCost: calculateBookCost(book.buyingPrice, book.numberOfCopies),
    buyingPrice: book.buyingPrice || 0,
    numberOfCopies: book.numberOfCopies || 0,
    purchaseDate: book.purchaseDate,
    image: book.image,
    directImageUrl: book.directImageUrl
  }))
}

// ============================================================================
// ACTIVITY SUMMARY
// ============================================================================

/**
 * Get cost activity summary (today, this week, this month)
 * @param userId - User ID for filtering (undefined for admin view)
 */
export async function getCostActivitySummary(
  userId: string | undefined
): Promise<CostActivitySummary> {
  const today = new Date()
  const startOfToday = new Date(today.setHours(0, 0, 0, 0))
  const startOfWeek = getDateDaysAgo(7)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const where = buildWhereClause(userId)

  const [
    spentToday,
    spentThisWeek,
    spentThisMonth,
    booksToday,
    booksThisWeek,
    booksThisMonth
  ] = await Promise.all([
    // Spent today
    prisma.book.aggregate({
      where: {
        ...where,
        type: BookType.HARD_COPY,
        purchaseDate: { gte: startOfToday }
      },
      _sum: { buyingPrice: true }
    }),
    // Spent this week
    prisma.book.aggregate({
      where: {
        ...where,
        type: BookType.HARD_COPY,
        purchaseDate: { gte: startOfWeek }
      },
      _sum: { buyingPrice: true }
    }),
    // Spent this month
    prisma.book.aggregate({
      where: {
        ...where,
        type: BookType.HARD_COPY,
        purchaseDate: { gte: startOfMonth }
      },
      _sum: { buyingPrice: true }
    }),
    // Books added today
    prisma.book.count({
      where: { ...where, createdAt: { gte: startOfToday } }
    }),
    // Books added this week
    prisma.book.count({
      where: { ...where, createdAt: { gte: startOfWeek } }
    }),
    // Books added this month
    prisma.book.count({
      where: { ...where, createdAt: { gte: startOfMonth } }
    })
  ])

  return {
    spentToday: spentToday._sum.buyingPrice || 0,
    spentThisWeek: spentThisWeek._sum.buyingPrice || 0,
    spentThisMonth: spentThisMonth._sum.buyingPrice || 0,
    booksAddedToday: booksToday,
    booksAddedThisWeek: booksThisWeek,
    booksAddedThisMonth: booksThisMonth
  }
}

// ============================================================================
// DETAILED BREAKDOWN
// ============================================================================

/**
 * Get detailed cost breakdown for data table
 * @param userId - User ID for filtering (undefined for admin view)
 * @param page - Page number (1-based)
 * @param pageSize - Items per page
 * @param sortBy - Field to sort by
 * @param sortOrder - Sort order (asc or desc)
 */
export async function getCostDetails(
  userId: string | undefined,
  page: number = 1,
  pageSize: number = 20,
  sortBy: string = 'purchaseDate',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ items: CostDetailItem[], total: number }> {
  const where = buildWhereClause(userId)

  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.book.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        buyingPrice: true,
        numberOfCopies: true,
        purchaseDate: true,
        authors: {
          select: {
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        publications: {
          select: {
            publication: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        entryById: true,
        entryBy: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: pageSize
    }),
    prisma.book.count({ where })
  ])

  const detailItems: CostDetailItem[] = items.map(book => ({
    bookId: book.id,
    bookName: book.name,
    bookType: book.type,
    buyingPrice: book.buyingPrice,
    numberOfCopies: book.numberOfCopies,
    totalCost: calculateBookCost(book.buyingPrice, book.numberOfCopies),
    purchaseDate: book.purchaseDate,
    authors: book.authors.map(a => ({ id: a.author.id, name: a.author.name })),
    categories: book.categories.map(c => ({ id: c.category.id, name: c.category.name })),
    publications: book.publications.map(p => ({ id: p.publication.id, name: p.publication.name })),
    entryById: book.entryById,
    entryBy: book.entryBy
  }))

  return { items: detailItems, total }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Build Prisma where clause based on user ID
 */
function buildWhereClause(userId?: string, dateFilter?: { startDate?: Date }): any {
  const where: any = {
    type: BookType.HARD_COPY,
    buyingPrice: { not: null }
  }

  // Filter by user (for non-admin views)
  if (userId) {
    where.entryById = userId
  }

  // Filter by date
  if (dateFilter?.startDate) {
    where.purchaseDate = { gte: dateFilter.startDate }
  }

  return where
}

/**
 * Calculate total cost for a book
 * Only applies to HARD_COPY books: buyingPrice * numberOfCopies
 */
function calculateBookCost(buyingPrice: number | null, numberOfCopies: number | null): number {
  if (buyingPrice === null) return 0
  const copies = numberOfCopies || 1
  return buyingPrice * copies
}

/**
 * Get date N days ago
 */
function getDateDaysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

/**
 * Group books by time period
 */
function groupBooksByTimePeriod(
  books: Array<{
    purchaseDate: Date | null
    buyingPrice: number | null
    numberOfCopies: number | null
  }>,
  grouping: TimePeriodGrouping
): Map<string, { totalCost: number; count: number }> {
  const grouped = new Map<string, { totalCost: number; count: number }>()

  books.forEach(book => {
    if (!book.purchaseDate) return

    const period = getTimePeriodKey(book.purchaseDate, grouping)
    const cost = calculateBookCost(book.buyingPrice, book.numberOfCopies)

    const existing = grouped.get(period)
    if (existing) {
      existing.totalCost += cost
      existing.count += 1
    } else {
      grouped.set(period, { totalCost: cost, count: 1 })
    }
  })

  return grouped
}

/**
 * Get time period key for grouping
 */
function getTimePeriodKey(date: Date, grouping: TimePeriodGrouping): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1

  switch (grouping) {
    case 'daily':
      const day = date.getDate()
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    case 'weekly':
      return `${year}-W${getWeekNumber(date)}`
    case 'monthly':
      return `${year}-${month.toString().padStart(2, '0')}`
    case 'yearly':
      return `${year.toString()}`
    default:
      return `${year}-${month.toString().padStart(2, '0')}`
  }
}

/**
 * Format period label for display
 */
function formatPeriodLabel(period: string, grouping: TimePeriodGrouping): string {
  switch (grouping) {
    case 'daily':
      return new Date(period).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    case 'weekly':
      return `Week ${period.split('-W')[1]}`
    case 'monthly':
      const [year, month] = period.split('-')
      return new Date(`${year}-${month}-01`).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      })
    case 'yearly':
      return period
    default:
      return period
  }
}

/**
 * Get week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
