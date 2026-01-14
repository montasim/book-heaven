/**
 * Blog Comments API Route
 *
 * GET /api/blog/[slug]/comments - Get approved comments for a post
 * POST /api/blog/[slug]/comments - Create a new comment
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

interface RouteParams {
  params: Promise<{ slug: string }>
}

const CommentsQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
})

/**
 * GET /api/blog/[slug]/comments
 * Get comments for a blog post
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    const validatedQuery = CommentsQuerySchema.parse(queryParams)

    const session = await getSession()
    const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN'

    // Check if post exists
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true, allowComments: true }
    })

    if (!post) {
      return NextResponse.json({
        success: false,
        error: 'Blog post not found',
        message: 'The requested blog post does not exist'
      }, { status: 404 })
    }

    const where: any = {
      postId: post.id,
      parentId: null, // Only get top-level comments
    }

    // Non-admins can see approved comments AND their own pending comments
    if (!isAdmin) {
      const conditions: any[] = [{ status: 'APPROVED' }]
      if (session) {
        conditions.push({ status: 'PENDING', authorId: session.userId })
      }
      where.OR = conditions
    }

    const [comments, total] = await Promise.all([
      prisma.blogComment.findMany({
        where,
        skip: (validatedQuery.page - 1) * validatedQuery.limit,
        take: validatedQuery.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              bio: true,
            }
          },
          replies: {
            where: !isAdmin ? {
              OR: (() => {
                const conditions: any[] = [{ status: 'APPROVED' }]
                if (session) {
                  conditions.push({ status: 'PENDING', authorId: session.userId })
                }
                return conditions
              })()
            } : undefined,
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  bio: true,
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      }),
      prisma.blogComment.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        comments,
        pagination: {
          total,
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          totalPages: Math.ceil(total / validatedQuery.limit)
        }
      }
    })

  } catch (error) {
    console.error('Blog comments fetch error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch comments'
    }, { status: 500 })
  }
}

/**
 * POST /api/blog/[slug]/comments
 * Create a new comment
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const session = await getSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to comment'
      }, { status: 401 })
    }

    const body = await request.json()

    const CommentSchema = z.object({
      content: z.string().min(1, 'Comment content is required'),
      parentId: z.string().optional(),
    })

    const validated = CommentSchema.parse(body)

    // Check if post exists and allows comments
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true, allowComments: true, title: true }
    })

    if (!post) {
      return NextResponse.json({
        success: false,
        error: 'Blog post not found',
        message: 'The requested blog post does not exist'
      }, { status: 404 })
    }

    if (!post.allowComments) {
      return NextResponse.json({
        success: false,
        error: 'Comments not allowed',
        message: 'Comments are not enabled for this post'
      }, { status: 400 })
    }

    // If parentId is provided, verify it exists and belongs to the same post
    if (validated.parentId) {
      const parentComment = await prisma.blogComment.findUnique({
        where: { id: validated.parentId },
        select: { postId: true }
      })

      if (!parentComment || parentComment.postId !== post.id) {
        return NextResponse.json({
          success: false,
          error: 'Invalid parent comment',
          message: 'The parent comment does not exist or belongs to a different post'
        }, { status: 400 })
      }
    }

    const comment = await prisma.blogComment.create({
      data: {
        content: validated.content,
        authorId: session.userId,
        postId: post.id,
        parentId: validated.parentId,
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
        }
      }
    })

    // Revalidate the blog post page
    revalidatePath(`/blog/${slug}`)

    return NextResponse.json({
      success: true,
      data: { comment },
      message: 'Comment created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Comment creation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create comment'
    }, { status: 500 })
  }
}
