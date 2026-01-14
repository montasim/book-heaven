/**
 * Blog Posts API Route
 *
 * GET /api/blog - List published blog posts (public)
 * POST /api/blog - Create new blog post (authenticated users/admins)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const BlogQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).optional(),
  categoryId: z.string().optional(),
  tagId: z.string().optional(),
  authorId: z.string().optional(),
  featured: z.string().optional().transform((val) => val === 'true'),
  orderBy: z.enum(['createdAt', 'publishedAt', 'title', 'viewCount']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional(),
})

/**
 * GET /api/blog
 * List blog posts with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    const validatedQuery = BlogQuerySchema.parse(queryParams)

    const session = await getSession()
    const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN'
    const currentUserId = session?.userId

    const where: any = {}

    // Non-admins can only see published posts
    if (!isAdmin) {
      where.OR = [
        { status: 'PUBLISHED' },
        currentUserId ? { authorId: currentUserId } : {},
      ].filter((condition) => Object.keys(condition).length > 0)
    }

    if (validatedQuery.search) {
      where.OR = [
        ...(where.OR || []),
        { title: { contains: validatedQuery.search, mode: 'insensitive' } },
        { excerpt: { contains: validatedQuery.search, mode: 'insensitive' } },
        { content: { contains: validatedQuery.search, mode: 'insensitive' } },
      ]
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status
    }

    if (validatedQuery.categoryId) {
      where.categoryId = validatedQuery.categoryId
    }

    if (validatedQuery.tagId) {
      where.tags = {
        some: { tagId: validatedQuery.tagId }
      }
    }

    if (validatedQuery.authorId) {
      where.authorId = validatedQuery.authorId
    }

    if (validatedQuery.featured !== undefined) {
      where.featured = validatedQuery.featured
    }

    const orderBy = validatedQuery.orderBy || 'createdAt'
    const orderDirection = validatedQuery.orderDirection || 'desc'

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip: (validatedQuery.page - 1) * validatedQuery.limit,
        take: validatedQuery.limit,
        orderBy: { [orderBy]: orderDirection },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                }
              }
            }
          },
          _count: {
            select: { comments: true }
          }
        }
      }),
      prisma.blogPost.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          total,
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          totalPages: Math.ceil(total / validatedQuery.limit)
        }
      }
    })

  } catch (error) {
    console.error('Blog posts fetch error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch blog posts'
    }, { status: 500 })
  }
}

/**
 * POST /api/blog
 * Create a new blog post
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to create blog posts'
      }, { status: 401 })
    }

    const body = await request.json()

    const BlogPostSchema = z.object({
      title: z.string().min(1, 'Title is required'),
      slug: z.string().min(1, 'Slug is required'),
      excerpt: z.string().optional(),
      content: z.string().min(1, 'Content is required'),
      coverImage: z.string().optional(),
      categoryId: z.string().optional(),
      tagIds: z.array(z.string()).default([]),
      status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).default('DRAFT'),
      scheduledFor: z.string().optional().transform((val) => val ? new Date(val) : undefined),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
      seoKeywords: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      allowComments: z.boolean().default(true),
    })

    const validated = BlogPostSchema.parse(body)

    // Check if slug is unique
    const existing = await prisma.blogPost.findUnique({
      where: { slug: validated.slug }
    })

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Slug already exists',
        message: 'A post with this slug already exists'
      }, { status: 409 })
    }

    // Calculate read time
    const wordCount = validated.content.split(/\s+/).length
    const readTime = Math.ceil(wordCount / 200)

    const post = await prisma.blogPost.create({
      data: {
        title: validated.title,
        slug: validated.slug,
        excerpt: validated.excerpt,
        content: validated.content,
        coverImage: validated.coverImage,
        authorId: session.userId,
        categoryId: validated.categoryId,
        status: validated.status,
        scheduledFor: validated.scheduledFor,
        seoTitle: validated.seoTitle,
        seoDescription: validated.seoDescription,
        seoKeywords: validated.seoKeywords,
        featured: validated.featured,
        allowComments: validated.allowComments,
        readTime,
        publishedAt: validated.status === 'PUBLISHED' ? new Date() : null,
        tags: {
          create: validated.tagIds.map((tagId) => ({ tagId }))
        }
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            }
          }
        },
        _count: {
          select: { comments: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { post },
      message: 'Blog post created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Blog post creation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create blog post'
    }, { status: 500 })
  }
}
