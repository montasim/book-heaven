import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface CreateTranslatorData {
  name: string
  description?: string | null
  image?: string | null
  entryById: string
}

export interface UpdateTranslatorData {
  name?: string
  description?: string | null
  image?: string | null
}

export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    total: number
    pages: number
    current: number
    limit: number
  }
}

/**
 * Get paginated translators
 */
export async function getTranslators(options: PaginationOptions = {}) {
  const { page = 1, limit = 10 } = options

  const skip = (page - 1) * limit

  const [translators, total] = await Promise.all([
    prisma.translator.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        entryBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            books: true,
          },
        },
      },
    }),
    prisma.translator.count(),
  ])

  return {
    translators,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit,
    },
  }
}

/**
 * Get translator by ID
 */
export async function getTranslatorById(id: string) {
  return prisma.translator.findUnique({
    where: { id },
    include: {
      entryBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      books: {
        include: {
          book: {
            select: {
              id: true,
              name: true,
              type: true,
              image: true,
            },
          },
        },
      },
    },
  })
}

/**
 * Create a new translator
 */
export async function createTranslator(data: CreateTranslatorData) {
  return prisma.translator.create({
    data: {
      name: data.name,
      description: data.description,
      image: data.image,
      entryById: data.entryById,
    },
    include: {
      entryBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Update translator
 */
export async function updateTranslator(id: string, data: UpdateTranslatorData) {
  return prisma.translator.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      image: data.image,
    },
    include: {
      entryBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Delete translator
 */
export async function deleteTranslator(id: string) {
  return prisma.translator.delete({
    where: { id },
  })
}

/**
 * Check if translator name exists
 */
export async function translatorNameExists(name: string, excludeId?: string): Promise<boolean> {
  const translator = await prisma.translator.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
      ...(excludeId ? {
        NOT: {
          id: excludeId,
        },
      } : {}),
    },
  })

  return !!translator
}

/**
 * Get translator with complete details for admin dashboard
 */
export async function getTranslatorWithCompleteDetails(id: string) {
  const translator = await prisma.translator.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      directImageUrl: true,
      entryDate: true,
      createdAt: true,
      updatedAt: true,
      entryBy: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          directAvatarUrl: true,
        },
      },
    },
  })

  if (!translator) return null

  // Get analytics data in parallel
  const [booksResult, viewStats, readersResult] = await Promise.all([
    // Get all books by this translator
    prisma.bookTranslator.findMany({
      where: { translatorId: id },
      include: {
        book: {
          include: {
            categories: {
              include: {
                category: true,
              },
            },
            publications: {
              include: {
                publication: true,
              },
            },
            series: {
              include: {
                series: true,
              },
            },
          },
        },
      },
    }),
    // View stats
    prisma.translatorView.aggregate({
      where: { translatorId: id },
      _count: {
        id: true,
      },
    }),
    // Get reading progress for all books by this translator
    prisma.readingProgress.findMany({
      where: {
        book: {
          translators: {
            some: {
              translatorId: id,
            },
          },
        },
      },
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
        book: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ])

  const books = booksResult.map(bt => bt.book)

  // Calculate analytics
  const totalBooks = books.length
  const totalPages = books.reduce((sum, book) => sum + (book.pageNumber || 0), 0)
  const totalSpend = books.reduce((sum, book) => sum + (book.buyingPrice || 0), 0)

  // Count books by type
  const booksByType = {
    HARD_COPY: books.filter(b => b.type === 'HARD_COPY').length,
    EBOOK: books.filter(b => b.type === 'EBOOK').length,
    AUDIO: books.filter(b => b.type === 'AUDIO').length,
  }

  // Calculate reader stats across all books
  const totalReaders = new Set(readersResult.map(r => r.userId)).size
  const completedReaders = readersResult.filter(r => r.isCompleted).length

  // Get unique readers with their aggregated stats
  const readerMap = new Map<string, any>()
  readersResult.forEach(r => {
    const userId = r.userId
    if (!readerMap.has(userId)) {
      readerMap.set(userId, {
        user: r.user,
        booksRead: 0,
        completedBooks: 0,
        totalProgress: 0,
        lastReadAt: r.lastReadAt,
      })
    }
    const reader = readerMap.get(userId)!
    reader.booksRead += 1
    if (r.isCompleted) reader.completedBooks += 1
    reader.totalProgress += r.progress
    if (r.lastReadAt > reader.lastReadAt) {
      reader.lastReadAt = r.lastReadAt
    }
  })

  const readers = Array.from(readerMap.values()).map(r => ({
    user: r.user,
    booksRead: r.booksRead,
    completedBooks: r.completedBooks,
    avgProgress: Math.round(r.totalProgress / r.booksRead),
    lastReadAt: r.lastReadAt,
  }))

  return {
    ...translator,
    analytics: {
      totalViews: viewStats._count.id,
      totalBooks,
      totalPages,
      totalSpend,
      booksByType,
      totalReaders,
      completedReaders,
    },
    readers,
  }
}

/**
 * Get paginated books by translator with detailed information
 */
export async function getBooksByTranslator(
  translatorId: string,
  options: {
    page?: number
    limit?: number
  } = {}
) {
  const { page = 1, limit = 10 } = options
  const skip = (page - 1) * limit

  const [bookTranslators, total] = await Promise.all([
    prisma.bookTranslator.findMany({
      where: { translatorId },
      include: {
        book: {
          include: {
            categories: {
              include: {
                category: true,
              },
            },
            publications: {
              include: {
                publication: true,
              },
            },
            series: {
              include: {
                series: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bookTranslator.count({ where: { translatorId } }),
  ])

  const books = bookTranslators.map(bt => bt.book)

  // Fetch additional analytics for each book
  const booksWithAnalytics = await Promise.all(
    books.map(async (book) => {
      const [viewCount, readerCount, completedReaders, avgProgress] = await Promise.all([
        prisma.bookView.count({ where: { bookId: book.id } }),
        prisma.readingProgress.count({ where: { bookId: book.id } }),
        prisma.readingProgress.count({
          where: { bookId: book.id, isCompleted: true },
        }),
        prisma.readingProgress.aggregate({
          where: { bookId: book.id },
          _avg: { progress: true },
        }),
      ])

      return {
        ...book,
        viewCount,
        readerCount,
        completedReaders,
        avgProgress: avgProgress._avg.progress || 0,
      }
    })
  )

  return {
    books: booksWithAnalytics,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

/**
 * Get all readers across all books by a translator
 */
export async function getTranslatorReaders(
  translatorId: string,
  options: {
    page?: number
    limit?: number
  } = {}
) {
  const { page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  // Get all reading progress records for books by this translator
  const [readers, total] = await Promise.all([
    prisma.readingProgress.findMany({
      where: {
        book: {
          translators: {
            some: {
              translatorId,
            },
          },
        },
      },
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
        book: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        lastReadAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.readingProgress.count({
      where: {
        book: {
          translators: {
            some: {
              translatorId,
            },
          },
        },
      },
    }),
  ])

  // Aggregate stats by user
  const readerMap = new Map<string, any>()

  readers.forEach(r => {
    const userId = r.userId
    if (!readerMap.has(userId)) {
      readerMap.set(userId, {
        user: r.user,
        booksRead: 0,
        completedBooks: 0,
        totalProgress: 0,
        lastReadAt: r.lastReadAt,
      })
    }
    const reader = readerMap.get(userId)!
    reader.booksRead += 1
    if (r.isCompleted) reader.completedBooks += 1
    reader.totalProgress += r.progress
    if (r.lastReadAt > reader.lastReadAt) {
      reader.lastReadAt = r.lastReadAt
    }
  })

  const aggregatedReaders = Array.from(readerMap.values()).map(r => ({
    user: r.user,
    booksRead: r.booksRead,
    completedBooks: r.completedBooks,
    avgProgress: Math.round(r.totalProgress / r.booksRead),
    lastReadAt: r.lastReadAt,
  }))

  // Sort by lastReadAt
  aggregatedReaders.sort((a, b) => b.lastReadAt.getTime() - a.lastReadAt.getTime())

  return {
    readers: aggregatedReaders,
    total: aggregatedReaders.length,
    pages: Math.ceil(aggregatedReaders.length / limit),
    currentPage: page,
  }
}

/**
 * Get translator view statistics
 */
export async function getTranslatorViewStats(translatorId: string) {
  const [totalViews, uniqueVisitors, viewsThisMonth] = await Promise.all([
    prisma.translatorView.count({ where: { translatorId } }),

    prisma.translatorView.groupBy({
      by: ['userId'],
      where: { translatorId },
    }).then(groups => groups.length),

    prisma.translatorView.count({
      where: {
        translatorId,
        visitedAt: {
          gte: new Date(new Date().setDate(1)), // First day of current month
        },
      },
    }),
  ])

  return {
    totalViews,
    uniqueVisitors,
    viewsThisMonth,
  }
}

/**
 * Get views grouped by date for charts
 */
export async function getTranslatorViewsByDate(
  translatorId: string,
  startDate: Date,
  endDate: Date
) {
  const views = await prisma.translatorView.groupBy({
    by: ['visitedAt'],
    where: {
      translatorId,
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
 * Get recent views for a translator
 */
export async function getRecentTranslatorViews(translatorId: string, limit = 10) {
  return await prisma.translatorView.findMany({
    where: { translatorId },
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
