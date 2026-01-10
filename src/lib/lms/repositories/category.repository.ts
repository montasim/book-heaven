/**
 * Category Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Category model
 */

import { prisma } from '../../prisma'

// ============================================================================
// CATEGORY QUERIES
// ============================================================================

/**
 * Get all categories with pagination and search
 */
export async function getCategories(options: {
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

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
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
      orderBy: { name: 'asc' }, // Categories often sorted alphabetically
      skip,
      take: limit,
    }),
    prisma.category.count({ where }),
  ])

  return {
    categories,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit,
    },
  }
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
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
 * Check if category exists
 */
export async function categoryExists(id: string): Promise<boolean> {
  const count = await prisma.category.count({
    where: { id },
  })
  return count > 0
}

/**
 * Check if category name exists (excluding current category)
 */
export async function categoryNameExists(name: string, excludeId?: string): Promise<boolean> {
  const where = excludeId
    ? {
        name: { equals: name, mode: 'insensitive' as const },
        NOT: { id: excludeId },
      }
    : { name: { equals: name, mode: 'insensitive' as const } }

  const count = await prisma.category.count({ where })
  return count > 0
}

/**
 * Check if category is linked to books-old
 */
export async function isCategoryLinkedToBooks(id: string): Promise<boolean> {
  const count = await prisma.bookCategory.count({
    where: { categoryId: id },
  })
  return count > 0
}

/**
 * Get all categories (for dropdowns/multi-select)
 */
export async function getAllCategories() {
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })
}

// ============================================================================
// CATEGORY MUTATIONS
// ============================================================================

/**
 * Create a new category
 */
export async function createCategory(data: {
  name: string
  description?: string
  image?: string
  directImageUrl?: string
  entryById: string
}) {
  const { entryById, ...categoryData } = data
  return prisma.category.create({
    data: {
      ...categoryData,
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
 * Update a category
 */
export async function updateCategory(
  id: string,
  data: {
    name?: string
    description?: string | null
    image?: string | null
    directImageUrl?: string | null
  }
) {
  return prisma.category.update({
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
 * Delete a category
 */
export async function deleteCategory(id: string) {
  // First check if category is linked to any books-old
  const isLinked = await isCategoryLinkedToBooks(id)
  if (isLinked) {
    throw new Error('Cannot delete category: linked to one or more books-old')
  }

  return prisma.category.delete({
    where: { id },
  })
}

// ============================================================================
// CATEGORY BOOKS MANAGEMENT
// ============================================================================

/**
 * Get all books for a category
 */
export async function getCategoryBooks(categoryId: string) {
  return prisma.bookCategory.findMany({
    where: { categoryId },
    include: {
      book: {
        include: {
          authors: {
            include: {
              author: true,
            },
          },
          publications: {
            include: {
              publication: true,
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
// ADMIN CATEGORY DETAILS
// ============================================================================

/**
 * Get category with complete details for admin dashboard
 */
export async function getCategoryWithCompleteDetails(id: string) {
  const category = await prisma.category.findUnique({
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
              publications: {
                include: {
                  publication: true,
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

  if (!category) return null

  // Get book IDs for this category
  const bookIds = category.books.map(cb => cb.book.id)

  // Get analytics data in parallel
  const [viewStats, totalReaders, completedReaders] = await Promise.all([
    // View stats
    prisma.categoryView.aggregate({
      where: { categoryId: id },
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
    HARD_COPY: category.books.filter(cb => cb.book.type === 'HARD_COPY').length,
    EBOOK: category.books.filter(cb => cb.book.type === 'EBOOK').length,
    AUDIO: category.books.filter(cb => cb.book.type === 'AUDIO').length,
  }

  const totalBooks = category.books.length
  const totalPages = category.books.reduce((sum, cb) => sum + (cb.book.pageNumber || 0), 0)
  const totalSpend = category.books.reduce((sum, cb) => sum + (cb.book.buyingPrice || 0), 0)

  return {
    ...category,
    analytics: {
      totalViews: viewStats._count.id,
      totalBooks,
      totalReaders,
      completedReaders,
      booksByType,
      totalPages,
      totalSpend,
    },
  }
}

/**
 * Get all books by a category with their stats
 */
export async function getCategoryBooksWithStats(
  categoryId: string,
  options: {
    page?: number
    limit?: number
  } = {}
) {
  const { page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  const [books, total] = await Promise.all([
    prisma.bookCategory.findMany({
      where: { categoryId },
      include: {
        book: {
          include: {
            authors: {
              include: {
                author: true,
              },
            },
            publications: {
              include: {
                publication: true,
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
    prisma.bookCategory.count({ where: { categoryId } }),
  ])

  // Get stats for each book
  const bookIds = books.map(cb => cb.book.id)
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

  const booksWithStats = books.map(cb => ({
    ...cb.book,
    viewCount: statsMap.get(cb.book.id) || 0,
    readerCount: readersMap.get(cb.book.id) || 0,
    completedReaders: completedReadersMap.get(cb.book.id) || 0,
    avgProgress: avgProgressMap.get(cb.book.id) || 0,
  }))

  return {
    books: booksWithStats,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

/**
 * Get readers across all category's books
 */
export async function getCategoryReaders(
  categoryId: string,
  options: {
    page?: number
    limit?: number
  } = {}
) {
  const { page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  // Get all books by this category
  const categoryBooks = await prisma.bookCategory.findMany({
    where: { categoryId },
    select: { bookId: true },
  })

  const bookIds = categoryBooks.map(cb => cb.bookId)

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

  // Group by user and aggregate their reading across category's books
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
 * Get aggregate reading statistics for a category
 */
export async function getCategoryReadingStats(categoryId: string) {
  // Get all books by this category
  const categoryBooks = await prisma.bookCategory.findMany({
    where: { categoryId },
    select: { bookId: true },
  })

  const bookIds = categoryBooks.map(cb => cb.bookId)

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