/**
 * Public Translator Detail API Route
 *
 * Provides detailed information about a specific translator
 * Includes access control for premium books
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/public/translators/[id]
 * Get detailed information about a specific translator
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const translatorId = params.id

    // Validate translator ID
    if (!translatorId || typeof translatorId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid translator ID',
        message: 'Translator ID is required and must be valid'
      }, { status: 400 })
    }

    // Check user authentication and premium status
    const userSession = await getSession()
    const userHasPremium = userSession ? (userSession.role === 'USER' ? false : userSession.role === 'ADMIN' ? true : false) : false
    const isAuthenticated = !!userSession

    // Find the translator with all books
    const translator = await prisma.translator.findUnique({
      where: { id: translatorId },
      include: {
        entryBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
            role: true,
            createdAt: true,
          }
        },
        books: {
          where: {
            book: {
              isPublic: true,
            }
          },
          include: {
            book: {
              include: {
                entryBy: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    name: true,
                    avatar: true,
                    bio: true,
                    role: true,
                    createdAt: true,
                  }
                },
                authors: {
                  include: {
                    author: {
                      select: {
                        id: true,
                        name: true,
                        description: true,
                        image: true,
                      }
                    }
                  }
                },
                translators: {
                  include: {
                    translator: {
                      select: {
                        id: true,
                        name: true,
                        description: true,
                        image: true,
                      }
                    }
                  }
                },
                categories: {
                  include: {
                    category: {
                      select: {
                        id: true,
                        name: true,
                        description: true,
                        image: true,
                      }
                    }
                  }
                },
                publications: {
                  include: {
                    publication: {
                      select: {
                        id: true,
                        name: true,
                        description: true,
                        image: true,
                      }
                    }
                  }
                },
                _count: {
                  select: {
                    readingProgress: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            books: true,
          }
        }
      }
    })

    // Get view statistics for analytics
    const viewStats = await prisma.translatorView.count({
      where: { translatorId }
    })

    if (!translator) {
      return NextResponse.json({
        success: false,
        error: 'Translator not found',
        message: 'The requested translator does not exist'
      }, { status: 404 })
    }

    // Calculate total readers across all books
    const totalReaders = translator.books.reduce((sum, bt) => {
      return sum + (bt.book._count.readingProgress || 0)
    }, 0)

    // Transform books to BookCard-compatible format
    const transformedBooks = translator.books
      .map(bt => {
        const book = bt.book
        const requiresPremium = book.requiresPremium
        const canAccess = !requiresPremium || userHasPremium

        return {
          id: book.id,
          name: book.name,
          type: book.type,
          summary: book.summary,
          pageNumber: book.pageNumber,
          image: book.image,
          requiresPremium,
          canAccess,
          readersCount: book._count.readingProgress || 0,
          authors: book.authors.map(ba => ({
            id: ba.author.id,
            name: ba.author.name,
          })),
          translators: book.translators.map(bt => ({
            id: bt.translator.id,
            name: bt.translator.name,
          })),
          categories: book.categories.map(bc => ({
            id: bc.category.id,
            name: bc.category.name,
          })),
          publications: book.publications.map(bp => ({
            id: bp.publication.id,
            name: bp.publication.name,
          })),
          entryBy: book.isPublic && book.entryBy.role === 'USER' ? {
            id: book.entryBy.id,
            username: book.entryBy.username,
            firstName: book.entryBy.firstName,
            lastName: book.entryBy.lastName,
            name: book.entryBy.name,
            avatar: book.entryBy.avatar,
          } : null,
        }
      })

    // Transform translator data
    const transformedTranslator = {
      id: translator.id,
      name: translator.name,
      description: translator.description,
      image: translator.image,
      directImageUrl: translator.directImageUrl,
      entryDate: translator.entryDate,
      entryBy: translator.entryBy.role === 'USER' ? {
        id: translator.entryBy.id,
        firstName: translator.entryBy.firstName,
        lastName: translator.entryBy.lastName,
        username: translator.entryBy.username,
        name: translator.entryBy.name,
        avatar: translator.entryBy.avatar,
        bio: translator.entryBy.bio,
      } : null,
      books: transformedBooks,
      statistics: {
        totalBooks: transformedBooks.length,
        totalReaders,
      },
      analytics: {
        totalViews: viewStats,
      }
    }

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        translator: transformedTranslator,
      },
      message: 'Translator details retrieved successfully'
    })

  } catch (error) {
    console.error('Get translator details error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve translator details',
      message: 'An error occurred while fetching translator information'
    }, { status: 500 })
  }
}
