/**
 * Public Series API Route
 *
 * Provides public access to series information
 * Only returns series that have at least one public book
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// ============================================================================
// REQUEST VALIDATION & CONFIGURATION
// ============================================================================

const SeriesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'bookCount', 'entryDate']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  minBooks: z.coerce.number().min(0).default(1),
})

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * GET /api/public/series
 *
 * Get public series with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validatedQuery = SeriesQuerySchema.parse(queryParams)

    const {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      minBooks
    } = validatedQuery

    const skip = (page - 1) * limit

    // Build filter conditions
    const where: any = {
      books: {
        some: {
          book: {
            isPublic: true
          }
        }
      }
    }

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Build sort conditions
    let orderBy: any
    switch (sortBy) {
      case 'name':
        orderBy = { name: sortOrder }
        break
      case 'bookCount':
        orderBy = { books: { _count: sortOrder } }
        break
      case 'entryDate':
        orderBy = { entryDate: sortOrder }
        break
      default:
        orderBy = { name: sortOrder }
    }

    // Execute queries in parallel
    const [series, total] = await Promise.all([
      prisma.series.findMany({
        where,
        include: {
          books: {
            where: {
              book: {
                isPublic: true
              }
            },
            include: {
              book: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  type: true,
                  requiresPremium: true,
                  _count: {
                    select: {
                      readingProgress: true,
                    }
                  }
                }
              }
            },
            orderBy: {
              order: 'asc'
            }
          },
          _count: {
            select: {
              books: {
                where: {
                  book: {
                    isPublic: true
                  }
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.series.count({ where })
    ])

    // Filter series by minimum book count
    const filteredSeries = series.filter(s => s._count.books >= minBooks)

    // Transform series data
    const transformedSeries = filteredSeries.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      image: s.image,
      entryDate: s.entryDate,
      bookCount: s._count.books,
      books: s.books
        .map(bs => ({
          ...bs.book,
          seriesOrder: bs.order,
          readersCount: bs.book._count.readingProgress,
        }))
        .sort((a, b) => a.seriesOrder - b.seriesOrder)
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        series: transformedSeries,
        pagination: {
          currentPage: page,
          totalPages,
          totalSeries: total,
          limit,
          hasNextPage,
          hasPreviousPage,
        },
        filters: {
          search: validatedQuery.search || null,
          minBooks: validatedQuery.minBooks,
        }
      },
      message: 'Series retrieved successfully'
    })

  } catch (error) {
    console.error('Get series error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        message: error.errors[0]?.message
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve series',
      message: 'An error occurred while fetching series'
    }, { status: 500 })
  }
}
