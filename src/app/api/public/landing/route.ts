/**
 * Landing Page Statistics API Route
 *
 * Returns real statistics for the landing page - OPTIMIZED FOR SPEED
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookType } from '@prisma/client'
import { unstable_cache } from 'next/cache'

// Cache configuration - cache for 5 minutes since this is public data
const CACHE_REVALIDATE = 300 // 5 minutes

/**
 * Get total counts efficiently with caching
 */
const getStatistics = unstable_cache(
    async () => {
        // Run all count queries in parallel for better performance
        const [
            totalBooks,
            totalUsers,
            totalCategories,
            totalAuthors,
            totalPublications,
            premiumBooks,
            activeReadersData
        ] = await Promise.all([
            // Total public books (ebooks & audiobooks)
            prisma.book.count({
                where: {
                    isPublic: true,
                    type: { in: [BookType.EBOOK, BookType.AUDIO] }
                }
            }),

            // Total users
            prisma.user.count(),

            // Total categories
            prisma.category.count(),

            // Total authors
            prisma.author.count(),

            // Total publications
            prisma.publication.count(),

            // Premium books count
            prisma.book.count({
                where: {
                    isPublic: true,
                    requiresPremium: true,
                    type: { in: [BookType.EBOOK, BookType.AUDIO] }
                }
            }),

            // Active readers count (unique users with reading progress)
            prisma.readingProgress.findMany({
                select: {
                    userId: true
                },
                distinct: ['userId']
            })
        ])

        return {
            totalBooks,
            totalUsers,
            totalCategories,
            totalAuthors,
            totalPublications,
            activeReaders: activeReadersData.length,
            premiumBooks
        }
    },
    ['landing-stats'],
    { revalidate: CACHE_REVALIDATE }
)

/**
 * Get featured books efficiently with caching
 */
const getFeaturedBooks = unstable_cache(
    async () => {
        // Use select instead of include for better performance
        const books = await prisma.book.findMany({
            where: {
                isPublic: true,
                featured: true,
                type: { in: [BookType.EBOOK, BookType.AUDIO] }
            },
            select: {
                id: true,
                name: true,
                image: true,
                directImageUrl: true,
                authors: {
                    select: {
                        author: {
                            select: {
                                name: true
                            }
                        }
                    },
                    take: 3
                }
            },
            take: 6,
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Get readers count in a separate query for better performance
        const bookIds = books.map(b => b.id)
        const readersCounts = await prisma.readingProgress.groupBy({
            by: ['bookId'],
            where: {
                bookId: { in: bookIds }
            },
            _count: {
                bookId: true
            }
        })

        const readersMap = new Map(
            readersCounts.map(r => [r.bookId, r._count.bookId])
        )

        return books.map(book => ({
            id: book.id,
            name: book.name,
            image: book.image,
            directImageUrl: book.directImageUrl,
            readersCount: readersMap.get(book.id) || 0,
            authors: book.authors.map(ba => ba.author)
        }))
    },
    ['landing-featured-books'],
    { revalidate: CACHE_REVALIDATE }
)

/**
 * Get popular categories efficiently with caching
 */
const getPopularCategories = unstable_cache(
    async () => {
        // Use a more efficient query with raw SQL
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
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
            orderBy: {
                books: {
                    _count: 'desc'
                }
            },
            take: 8
        })

        return categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            bookCount: cat._count.books
        }))
    },
    ['landing-categories'],
    { revalidate: CACHE_REVALIDATE }
)

/**
 * Get recent books efficiently with caching
 */
const getRecentBooks = unstable_cache(
    async () => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        const books = await prisma.book.findMany({
            where: {
                isPublic: true,
                type: { in: [BookType.EBOOK, BookType.AUDIO] },
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                id: true,
                name: true,
                image: true,
                directImageUrl: true,
                authors: {
                    select: {
                        author: {
                            select: {
                                name: true
                            }
                        }
                    },
                    take: 2
                }
            },
            take: 4,
            orderBy: {
                createdAt: 'desc'
            }
        })

        return books.map(book => ({
            id: book.id,
            name: book.name,
            image: book.image,
            directImageUrl: book.directImageUrl,
            authors: book.authors.map(ba => ba.author)
        }))
    },
    ['landing-recent-books'],
    { revalidate: CACHE_REVALIDATE }
)

/**
 * GET /api/public/landing
 *
 * Get landing page statistics and featured content - OPTIMIZED
 */
export async function GET(request: NextRequest) {
    try {
        // Fetch all data in parallel with caching
        const [statistics, featuredBooks, popularCategories, recentBooks] = await Promise.all([
            getStatistics(),
            getFeaturedBooks(),
            getPopularCategories(),
            getRecentBooks()
        ])

        return NextResponse.json({
            success: true,
            data: {
                statistics: {
                    ...statistics,
                    recentBooksCount: recentBooks.length
                },
                featuredBooks,
                popularCategories,
                recentBooks
            }
        })

    } catch (error) {
        console.error('Get landing stats error:', error)

        return NextResponse.json({
            success: false,
            error: 'Failed to retrieve landing page statistics',
            message: 'An error occurred while fetching landing page data'
        }, { status: 500 })
    }
}
