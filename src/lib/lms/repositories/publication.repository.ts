/**
 * Publication Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Publication model
 */

import { prisma } from '../../prisma'

// ============================================================================
// PUBLICATION QUERIES
// ============================================================================

/**
 * Get all publications with pagination and search
 */
export async function getPublications(options: {
  page?: number
  search?: string
  limit?: number
} = {}) {
  const { page = 1, search = '', limit = 10 } = options
  const skip = (page - 1) * limit

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [publications, total] = await Promise.all([
    prisma.publication.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.publication.count({ where }),
  ])

  return {
    publications,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit,
    },
  }
}

/**
 * Get publication by ID
 */
export async function getPublicationById(id: string) {
  return prisma.publication.findUnique({
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
 * Check if publication exists
 */
export async function publicationExists(id: string): Promise<boolean> {
  const count = await prisma.publication.count({
    where: { id },
  })
  return count > 0
}

/**
 * Check if publication name exists (excluding current publication)
 */
export async function publicationNameExists(name: string, excludeId?: string): Promise<boolean> {
  const where = excludeId
    ? {
        name: { equals: name, mode: 'insensitive' as const },
        NOT: { id: excludeId },
      }
    : { name: { equals: name, mode: 'insensitive' as const } }

  const count = await prisma.publication.count({ where })
  return count > 0
}

/**
 * Check if publication is linked to books-old
 */
export async function isPublicationLinkedToBooks(id: string): Promise<boolean> {
  const count = await prisma.bookPublication.count({
    where: { publicationId: id },
  })
  return count > 0
}

// ============================================================================
// PUBLICATION MUTATIONS
// ============================================================================

/**
 * Create a new publication
 */
export async function createPublication(data: {
  name: string
  description?: string
  image?: string
  directImageUrl?: string
  entryById: string
}) {
  const { entryById, ...publicationData } = data
  return prisma.publication.create({
    data: {
      ...publicationData,
      entryBy: {
        connect: { id: entryById }
      }
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
 * Update a publication
 */
export async function updatePublication(
  id: string,
  data: {
    name?: string
    description?: string | null
    image?: string | null
    directImageUrl?: string | null
  }
) {
  return prisma.publication.update({
    where: { id },
    data,
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
 * Delete a publication
 */
export async function deletePublication(id: string) {
  // First check if publication is linked to any books-old
  const isLinked = await isPublicationLinkedToBooks(id)
  if (isLinked) {
    throw new Error('Cannot delete publication: linked to one or more books-old')
  }

  return prisma.publication.delete({
    where: { id },
  })
}

// ============================================================================
// PUBLICATION BOOKS MANAGEMENT
// ============================================================================

/**
 * Get all books for a publication
 */
export async function getPublicationBooks(publicationId: string) {
  return prisma.bookPublication.findMany({
    where: { publicationId },
    include: {
      book: {
        include: {
          authors: {
            include: {
              author: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      book: {
        createdAt: 'desc',
      },
    },
  })
}

// ============================================================================
// ADMIN PUBLICATION DETAILS
// ============================================================================

/**
 * Get publication with complete details for admin dashboard
 */
export async function getPublicationWithCompleteDetails(id: string) {
  const publication = await prisma.publication.findUnique({
    where: { id },
    include: {
      entryBy: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          directAvatarUrl: true,
        },
      },
      books: {
        include: {
          book: {
            include: {
              authors: {
                include: {
                  author: true,
                },
              },
              categories: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          book: {
            createdAt: 'desc',
          },
        },
      },
    },
  })

  if (!publication) return null

  // Get book IDs for this publication
  const bookIds = publication.books.map(pb => pb.book.id)

  // Get analytics data in parallel
  const [viewStats, totalReaders, completedReaders] = await Promise.all([
    // View stats
    prisma.publicationView.aggregate({
      where: { publicationId: id },
      _count: {
        id: true,
      },
    }),

    // Total unique readers across all books
    prisma.readingProgress.groupBy({
      by: ['userId'],
      where: {
        bookId: { in: bookIds },
      },
    }).then(groups => groups.length),

    // Completed readers across all books
    prisma.readingProgress.count({
      where: {
        bookId: { in: bookIds },
        isCompleted: true,
      },
    }),
  ])

  // Calculate book stats
  const booksByType = {
    HARD_COPY: publication.books.filter(pb => pb.book.type === 'HARD_COPY').length,
    EBOOK: publication.books.filter(pb => pb.book.type === 'EBOOK').length,
    AUDIO: publication.books.filter(pb => pb.book.type === 'AUDIO').length,
  }

  const totalBooks = publication.books.length
  const totalPages = publication.books.reduce((sum, pb) => sum + (pb.book.pageNumber || 0), 0)

  return {
    ...publication,
    analytics: {
      totalViews: viewStats._count.id,
      totalBooks,
      totalReaders,
      completedReaders,
      booksByType,
      totalPages,
    },
  }
}

/**
 * Get all books by a publication with their stats
 */
export async function getPublicationBooksWithStats(
  publicationId: string,
  options: {
    page?: number
    limit?: number
  } = {}
) {
  const { page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  const [books, total] = await Promise.all([
    prisma.bookPublication.findMany({
      where: { publicationId },
      include: {
        book: {
          include: {
            authors: {
              include: {
                author: true,
              },
            },
            categories: {
              include: {
                category: true,
              },
            },
            series: {
              include: {
                series: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        book: {
          createdAt: 'desc',
        },
      },
      skip,
      take: limit,
    }),
    prisma.bookPublication.count({ where: { publicationId } }),
  ])

  // Get stats for each book
  const bookIds = books.map(pb => pb.book.id)
  const bookStats = await prisma.bookView.groupBy({
    by: ['bookId'],
    where: { bookId: { in: bookIds } },
    _count: {
      id: true,
    },
  })

  const readerStats = await prisma.readingProgress.groupBy({
    by: ['bookId'],
    where: { bookId: { in: bookIds } },
    _count: {
      id: true,
    },
  })

  // Get completed readers count per book
  const completedReadersStats = await prisma.readingProgress.groupBy({
    by: ['bookId'],
    where: {
      bookId: { in: bookIds },
      isCompleted: true,
    },
    _count: {
      id: true,
    },
  })

  // Get average progress per book
  const avgProgressStats = await prisma.readingProgress.groupBy({
    by: ['bookId'],
    where: { bookId: { in: bookIds } },
    _avg: {
      progress: true,
    },
  })

  const statsMap = new Map()
  bookStats.forEach(stat => {
    statsMap.set(stat.bookId, stat._count.id)
  })

  const readersMap = new Map()
  readerStats.forEach(stat => {
    readersMap.set(stat.bookId, stat._count.id)
  })

  const completedReadersMap = new Map()
  completedReadersStats.forEach(stat => {
    completedReadersMap.set(stat.bookId, stat._count.id)
  })

  const avgProgressMap = new Map()
  avgProgressStats.forEach(stat => {
    avgProgressMap.set(stat.bookId, Math.round((stat._avg.progress || 0) * 100) / 100)
  })

  const booksWithStats = books.map(pb => ({
    ...pb.book,
    viewCount: statsMap.get(pb.book.id) || 0,
    readerCount: readersMap.get(pb.book.id) || 0,
    completedReaders: completedReadersMap.get(pb.book.id) || 0,
    avgProgress: avgProgressMap.get(pb.book.id) || 0,
  }))

  return {
    books: booksWithStats,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

/**
 * Get readers across all publication's books
 */
export async function getPublicationReaders(
  publicationId: string,
  options: {
    page?: number
    limit?: number
  } = {}
) {
  const { page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  // Get all books by this publication
  const publicationBooks = await prisma.bookPublication.findMany({
    where: { publicationId },
    select: { bookId: true },
  })

  const bookIds = publicationBooks.map(pb => pb.bookId)

  // Get reading progress for all these books
  const [progressRecords, total] = await Promise.all([
    prisma.readingProgress.findMany({
      where: {
        bookId: { in: bookIds },
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
      },
      orderBy: {
        lastReadAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.readingProgress.count({
      where: { bookId: { in: bookIds } },
    }),
  ])

  // Group by user and aggregate their reading across publication's books
  const userMap = new Map()

  progressRecords.forEach(record => {
    if (!userMap.has(record.userId)) {
      userMap.set(record.userId, {
        user: record.user,
        booksRead: 0,
        totalProgress: 0,
        lastReadAt: record.lastReadAt,
        completedBooks: 0,
      })
    }

    const userData = userMap.get(record.userId)!
    userData.booksRead += 1
    userData.totalProgress += record.progress
    if (record.isCompleted) {
      userData.completedBooks += 1
    }
    if (new Date(record.lastReadAt) > new Date(userData.lastReadAt)) {
      userData.lastReadAt = record.lastReadAt
    }
  })

  const readers = Array.from(userMap.values()).map(data => ({
    ...data,
    avgProgress: Math.round(data.totalProgress / data.booksRead),
  }))

  return {
    readers,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

/**
 * Get aggregate reading statistics for a publication
 */
export async function getPublicationReadingStats(publicationId: string) {
  // Get all books by this publication
  const publicationBooks = await prisma.bookPublication.findMany({
    where: { publicationId },
    select: { bookId: true },
  })

  const bookIds = publicationBooks.map(pb => pb.bookId)

  const [
    totalReadersResult,
    completedReadersResult,
    activeReadersResult,
    avgProgressResult,
  ] = await Promise.all([
    // Total readers
    prisma.readingProgress.groupBy({
      by: ['userId'],
      where: { bookId: { in: bookIds } },
    }).then(groups => groups.length),

    // Completed readers (count of completed progress records)
    prisma.readingProgress.count({
      where: {
        bookId: { in: bookIds },
        isCompleted: true,
      },
    }),

    // Currently reading
    prisma.readingProgress.groupBy({
      by: ['userId'],
      where: {
        bookId: { in: bookIds },
        isCompleted: false,
        progress: { gt: 0 },
      },
    }).then(groups => groups.length),

    // Average progress
    prisma.readingProgress.aggregate({
      where: { bookId: { in: bookIds } },
      _avg: {
        progress: true,
      },
    }),
  ])

  return {
    totalReaders: totalReadersResult,
    completedReaders: completedReadersResult,
    activeReaders: activeReadersResult,
    avgProgress: avgProgressResult._avg.progress || 0,
  }
}