/**
 * Public Publications API Route
 *
 * Provides public access to publications information
 * Only returns publications that have at least one public book
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// ============================================================================
// REQUEST VALIDATION & CONFIGURATION
// ============================================================================

const PublicationsQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(1000).default(20),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'bookCount', 'entryDate', 'views', 'popularity']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    minBooks: z.coerce.number().min(0).default(1),
})

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * GET /api/public/publications
 *
 * Get public publications with pagination and search
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())

        // Validate query parameters
        const validatedQuery = PublicationsQuerySchema.parse(queryParams)

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

        // For views and popularity sorting, we need to fetch all data and sort manually
        if (sortBy === 'views' || sortBy === 'popularity') {
            const [publications, total] = await Promise.all([
                prisma.publication.findMany({
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
                                },
                                views: true
                            }
                        }
                    },
                }),
                prisma.publication.count({ where })
            ])

            // Calculate metrics and sort
            const publicationsWithMetrics = publications.map(publication => {
                const totalReaders = publication.books.reduce((sum, bp) => {
                    return sum + (bp.book._count.readingProgress || 0)
                }, 0)

                return {
                    ...publication,
                    viewCount: publication._count.views,
                    totalReaders
                }
            })

            // Sort by the requested field
            publicationsWithMetrics.sort((a, b) => {
                const aValue = sortBy === 'views' ? a.viewCount : a.totalReaders
                const bValue = sortBy === 'views' ? b.viewCount : b.totalReaders
                return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
            })

            // Filter by minimum book count
            const filteredPublications = publicationsWithMetrics.filter(p => p._count.books >= minBooks)

            // Apply pagination after sorting
            const paginatedPublications = filteredPublications.slice(skip, skip + limit)

            // Transform publications data
            const transformedPublications = paginatedPublications.map(publication => ({
                id: publication.id,
                name: publication.name,
                description: publication.description,
                image: publication.image,
                entryDate: publication.entryDate,
                bookCount: publication._count.books,
                viewCount: publication.viewCount,
                totalReaders: publication.totalReaders,
                books: publication.books
                    .map(bp => bp.book)
                    .sort((a, b) => b._count.readingProgress - a._count.readingProgress)
                    .slice(0, 6)
                    .map(book => ({
                        id: book.id,
                        name: book.name,
                        type: book.type,
                        image: book.image,
                        requiresPremium: book.requiresPremium,
                        readersCount: book._count.readingProgress,
                    }))
            }))

            // Calculate pagination info
            const totalPages = Math.ceil(filteredPublications.length / limit)
            const hasNextPage = page < totalPages
            const hasPreviousPage = page > 1

            return NextResponse.json({
                success: true,
                data: {
                    publications: transformedPublications,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalPublications: filteredPublications.length,
                        limit,
                        hasNextPage,
                        hasPreviousPage,
                    },
                    filters: {
                        search: validatedQuery.search || null,
                        minBooks: validatedQuery.minBooks,
                        sortBy,
                        sortOrder,
                    }
                },
                message: 'Publications retrieved successfully'
            })
        }

        // Build sort conditions for standard fields
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
        const [publications, total] = await Promise.all([
            prisma.publication.findMany({
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
                            },
                            views: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy,
            }),
            prisma.publication.count({ where })
        ])

        // Filter publications by minimum book count
        const filteredPublications = publications.filter(publication => publication._count.books >= minBooks)

        // Transform publications data
        const transformedPublications = filteredPublications.map(publication => {
            const totalReaders = publication.books.reduce((sum, bp) => {
                return sum + (bp.book._count.readingProgress || 0)
            }, 0)

            return {
                id: publication.id,
                name: publication.name,
                description: publication.description,
                image: publication.image,
                entryDate: publication.entryDate,
                bookCount: publication._count.books,
                viewCount: publication._count.views,
                totalReaders,
                books: publication.books
                    .map(bp => bp.book)
                    .sort((a, b) => b._count.readingProgress - a._count.readingProgress)
                    .slice(0, 6)
                    .map(book => ({
                        id: book.id,
                        name: book.name,
                        type: book.type,
                        image: book.image,
                        requiresPremium: book.requiresPremium,
                        readersCount: book._count.readingProgress,
                    }))
            }
        })

        // Calculate pagination info
        const totalPages = Math.ceil(total / limit)
        const hasNextPage = page < totalPages
        const hasPreviousPage = page > 1

        // Return response
        return NextResponse.json({
            success: true,
            data: {
                publications: transformedPublications,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalPublications: total,
                    limit,
                    hasNextPage,
                    hasPreviousPage,
                },
                filters: {
                    search: validatedQuery.search || null,
                    minBooks: validatedQuery.minBooks,
                    sortBy,
                    sortOrder,
                }
            },
            message: 'Publications retrieved successfully'
        })

    } catch (error) {
        console.error('Get publications error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: 'Invalid query parameters',
                message: error.errors[0]?.message
            }, { status: 400 })
        }

        return NextResponse.json({
            success: false,
            error: 'Failed to retrieve publications',
            message: 'An error occurred while fetching publications'
        }, { status: 500 })
    }
}
