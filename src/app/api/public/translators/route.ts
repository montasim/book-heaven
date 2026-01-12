/**
 * Public Translators API Route
 *
 * Provides public access to translators information
 * Only returns translators who have at least one public book
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// ============================================================================
// REQUEST VALIDATION & CONFIGURATION
// ============================================================================

const TranslatorsQuerySchema = z.object({
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
 * GET /api/public/translators
 *
 * Get public translators with pagination and search
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())

        // Validate query parameters
        const validatedQuery = TranslatorsQuerySchema.parse(queryParams)

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
            const [translators, total] = await Promise.all([
                prisma.translator.findMany({
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
                    }
                }),
                prisma.translator.count({ where })
            ])

            // Calculate metrics and sort
            const translatorsWithMetrics = translators.map(translator => {
                const totalReaders = translator.books.reduce((sum, bt) => {
                    return sum + (bt.book._count.readingProgress || 0)
                }, 0)

                return {
                    ...translator,
                    viewCount: translator._count.views,
                    totalReaders
                }
            })

            // Sort by the requested field
            translatorsWithMetrics.sort((a, b) => {
                const aValue = sortBy === 'views' ? a.viewCount : a.totalReaders
                const bValue = sortBy === 'views' ? b.viewCount : b.totalReaders
                return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
            })

            // Filter by minimum book count
            const filteredTranslators = translatorsWithMetrics.filter(t => t._count.books >= minBooks)

            // Apply pagination after sorting
            const paginatedTranslators = filteredTranslators.slice(skip, skip + limit)

            // Transform translators data
            const transformedTranslators = paginatedTranslators.map(translator => ({
                id: translator.id,
                name: translator.name,
                description: translator.description,
                image: translator.image,
                entryDate: translator.entryDate,
                bookCount: translator._count.books,
                viewCount: translator.viewCount,
                totalReaders: translator.totalReaders,
                books: translator.books
                    .map(bt => bt.book)
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
            const totalPages = Math.ceil(filteredTranslators.length / limit)
            const hasNextPage = page < totalPages
            const hasPreviousPage = page > 1

            return NextResponse.json({
                success: true,
                data: {
                    translators: transformedTranslators,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalTranslators: filteredTranslators.length,
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
                message: 'Translators retrieved successfully'
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
        const [translators, total] = await Promise.all([
            prisma.translator.findMany({
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
            prisma.translator.count({ where })
        ])

        // Filter translators by minimum book count
        const filteredTranslators = translators.filter(translator => translator._count.books >= minBooks)

        // Transform translators data
        const transformedTranslators = filteredTranslators.map(translator => {
            const totalReaders = translator.books.reduce((sum, bt) => {
                return sum + (bt.book._count.readingProgress || 0)
            }, 0)

            return {
                id: translator.id,
                name: translator.name,
                description: translator.description,
                image: translator.image,
                entryDate: translator.entryDate,
                bookCount: translator._count.books,
                viewCount: translator._count.views,
                totalReaders,
                books: translator.books
                    .map(bt => bt.book)
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
                translators: transformedTranslators,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalTranslators: total,
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
            message: 'Translators retrieved successfully'
        })

    } catch (error) {
        console.error('Get translators error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: 'Invalid query parameters',
                message: error.errors[0]?.message
            }, { status: 400 })
        }

        return NextResponse.json({
            success: false,
            error: 'Failed to retrieve translators',
            message: 'An error occurred while fetching translators'
        }, { status: 500 })
    }
}
