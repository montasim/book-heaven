/**
 * Public Series Detail API Route
 *
 * Get individual series with books
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as seriesViewRepository from '@/lib/lms/repositories/series-view.repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/public/series/[id]
 *
 * Get series by ID with all books
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    const series = await prisma.series.findUnique({
      where: { id },
      include: {
        books: {
          where: {
            book: {
              isPublic: true
            }
          },
          include: {
            book: {
              include: {
                authors: {
                  include: {
                    author: true
                  }
                },
                categories: {
                  include: {
                    category: true
                  }
                },
                _count: {
                  select: {
                    readingProgress: true
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
      }
    })

    if (!series) {
      return NextResponse.json({
        success: false,
        error: 'Series not found'
      }, { status: 404 })
    }

    // Track view (non-blocking)
    const sessionId = request.headers.get('x-session-id')
    const userId = request.headers.get('x-user-id') || undefined
    seriesViewRepository.createSeriesView({
      seriesId: id,
      userId,
      sessionId: sessionId || undefined,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      referrer: request.headers.get('referer') || undefined,
    }).catch(err => console.error('Failed to track series view:', err))

    // Transform series data
    const transformedSeries = {
      id: series.id,
      name: series.name,
      description: series.description,
      image: series.image,
      entryDate: series.entryDate,
      bookCount: series._count.books,
      books: series.books.map(bs => ({
        ...bs.book,
        seriesOrder: bs.order,
        readersCount: bs.book._count.readingProgress,
      }))
    }

    return NextResponse.json({
      success: true,
      data: transformedSeries,
    })
  } catch (error) {
    console.error('Get series error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch series'
    }, { status: 500 })
  }
}
