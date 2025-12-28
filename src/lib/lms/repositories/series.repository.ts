/**
 * Series Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Series model
 */

import { prisma } from '../../prisma'

// ============================================================================
// SERIES QUERIES
// ============================================================================

/**
 * Get all series with pagination and search
 */
export async function getSeries(options: {
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

  const [series, total] = await Promise.all([
    prisma.series.findMany({
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
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.series.count({ where }),
  ])

  return {
    series,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit,
    },
  }
}

/**
 * Get series by ID
 */
export async function getSeriesById(id: string) {
  return prisma.series.findUnique({
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
              image: true,
              type: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
      _count: {
        select: {
          books: true,
        },
      },
    },
  })
}

/**
 * Create series
 */
export async function createSeries(data: {
  name: string
  description?: string
  image?: string
  entryById: string
}) {
  return prisma.series.create({
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
 * Update series
 */
export async function updateSeries(id: string, data: {
  name?: string
  description?: string
  image?: string
}) {
  return prisma.series.update({
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
 * Delete series
 */
export async function deleteSeries(id: string) {
  return prisma.series.delete({
    where: { id },
  })
}

/**
 * Get books in a series with proper ordering
 */
export async function getSeriesBooks(seriesId: string) {
  const bookSeries = await prisma.bookSeries.findMany({
    where: { seriesId },
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
      order: 'asc',
    },
  })

  return bookSeries.map(bs => ({
    ...bs.book,
    seriesOrder: bs.order,
  }))
}

/**
 * Add book to series
 */
export async function addBookToSeries(data: {
  bookId: string
  seriesId: string
  order: number
}) {
  return prisma.bookSeries.create({
    data,
    include: {
      book: {
        select: {
          id: true,
          name: true,
        },
      },
      series: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

/**
 * Update book in series (change order)
 */
export async function updateBookInSeries(bookId: string, seriesId: string, order: number) {
  return prisma.bookSeries.update({
    where: {
      bookId_seriesId: {
        bookId,
        seriesId,
      },
    },
    data: { order },
  })
}

/**
 * Remove book from series
 */
export async function removeBookFromSeries(bookId: string, seriesId: string) {
  return prisma.bookSeries.delete({
    where: {
      bookId_seriesId: {
        bookId,
        seriesId,
      },
    },
  })
}

/**
 * Get series for a specific book
 */
export async function getBookSeries(bookId: string) {
  return prisma.bookSeries.findMany({
    where: { bookId },
    include: {
      series: true,
    },
    orderBy: {
      order: 'asc',
    },
  })
}

/**
 * Get previous and next books in a series
 */
export async function getSeriesNeighbors(bookId: string, seriesId: string) {
  const currentBook = await prisma.bookSeries.findUnique({
    where: {
      bookId_seriesId: {
        bookId,
        seriesId,
      },
    },
    select: {
      order: true,
    },
  })

  if (!currentBook) {
    return { previous: null, next: null }
  }

  const [previous, next] = await Promise.all([
    prisma.bookSeries.findFirst({
      where: {
        seriesId,
        order: {
          lt: currentBook.order,
        },
      },
      include: {
        book: {
          select: {
            id: true,
            name: true,
            image: true,
            type: true,
          },
        },
      },
      orderBy: {
        order: 'desc',
      },
      take: 1,
    }),
    prisma.bookSeries.findFirst({
      where: {
        seriesId,
        order: {
          gt: currentBook.order,
        },
      },
      include: {
        book: {
          select: {
            id: true,
            name: true,
            image: true,
            type: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
      take: 1,
    }),
  ])

  return {
    previous: previous?.book || null,
    next: next?.book || null,
  }
}
