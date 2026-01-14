/**
 * Blog Post by Slug API Route
 *
 * GET /api/blog/[slug] - Get a single published post (public)
 * PATCH /api/blog/[slug] - Update post (author/admin only)
 * DELETE /api/blog/[slug] - Delete post (author/admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

interface RouteParams {
  params: Promise<{ slug: string }>
}

/**
 * GET /api/blog/[slug]
 * Get a single blog post by slug
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const session = await getSession()
    const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN'
    const currentUserId = session?.userId

    const post = await prisma.blogPost.findUnique({
      where: { slug },
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

    if (!post) {
      return NextResponse.json({
        success: false,
        error: 'Blog post not found',
        message: 'The requested blog post does not exist'
      }, { status: 404 })
    }

    // Check access permissions
    if (!isAdmin && post.status !== 'PUBLISHED' && post.authorId !== currentUserId) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to view this post'
      }, { status: 403 })
    }

    // Increment view count for published posts (non-blocking)
    if (post.status === 'PUBLISHED') {
      prisma.blogPost.update({
        where: { slug },
        data: { viewCount: { increment: 1 } }
      }).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      data: { post }
    })

  } catch (error) {
    console.error('Blog post fetch error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch blog post'
    }, { status: 500 })
  }
}

/**
 * PATCH /api/blog/[slug]
 * Update a blog post
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const session = await getSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to update blog posts'
      }, { status: 401 })
    }

    const existing = await prisma.blogPost.findUnique({
      where: { slug },
      select: { authorId: true, id: true, publishedAt: true }
    })

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Blog post not found',
        message: 'The requested blog post does not exist'
      }, { status: 404 })
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
    if (existing.authorId !== session.userId && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to update this post'
      }, { status: 403 })
    }

    const body = await request.json()

    const BlogPostSchema = z.object({
      title: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      excerpt: z.string().optional(),
      content: z.string().min(1).optional(),
      coverImage: z.string().optional(),
      categoryId: z.string().nullable().optional(),
      tagIds: z.array(z.string()).optional(),
      status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).optional(),
      scheduledFor: z.string().optional().transform((val) => val ? new Date(val) : undefined),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
      seoKeywords: z.array(z.string()).optional(),
      featured: z.boolean().optional(),
      allowComments: z.boolean().optional(),
    })

    const validated = BlogPostSchema.parse(body)

    // Check if new slug is unique (if changed)
    if (validated.slug && validated.slug !== slug) {
      const slugExists = await prisma.blogPost.findFirst({
        where: {
          slug: validated.slug,
          NOT: { id: existing.id }
        }
      })

      if (slugExists) {
        return NextResponse.json({
          success: false,
          error: 'Slug already exists',
          message: 'A post with this slug already exists'
        }, { status: 409 })
      }
    }

    // Calculate read time if content is being updated
    let readTime = undefined
    if (validated.content) {
      const wordCount = validated.content.split(/\s+/).length
      readTime = Math.ceil(wordCount / 200)
    }

    // Update tags if provided
    if (validated.tagIds) {
      await prisma.blogPostTag.deleteMany({
        where: { postId: existing.id }
      })
    }

    const post = await prisma.blogPost.update({
      where: { id: existing.id },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.slug && { slug: validated.slug }),
        ...(validated.excerpt !== undefined && { excerpt: validated.excerpt }),
        ...(validated.content && { content: validated.content }),
        ...(validated.coverImage !== undefined && { coverImage: validated.coverImage }),
        ...(validated.categoryId !== undefined && { categoryId: validated.categoryId }),
        ...(validated.status && { status: validated.status }),
        ...(validated.scheduledFor !== undefined && { scheduledFor: validated.scheduledFor }),
        ...(validated.seoTitle !== undefined && { seoTitle: validated.seoTitle }),
        ...(validated.seoDescription !== undefined && { seoDescription: validated.seoDescription }),
        ...(validated.seoKeywords !== undefined && { seoKeywords: validated.seoKeywords }),
        ...(validated.featured !== undefined && { featured: validated.featured }),
        ...(validated.allowComments !== undefined && { allowComments: validated.allowComments }),
        ...(readTime && { readTime }),
        ...(validated.status === 'PUBLISHED' && !existing.publishedAt && {
          publishedAt: new Date()
        }),
        ...(validated.tagIds && {
          tags: {
            create: validated.tagIds.map((tagId) => ({ tagId }))
          }
        })
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

    // Revalidate paths
    revalidatePath('/dashboard/blog')
    revalidatePath('/blog')
    revalidatePath(`/blog/${post.slug}`)

    return NextResponse.json({
      success: true,
      data: { post },
      message: 'Blog post updated successfully'
    })

  } catch (error) {
    console.error('Blog post update error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update blog post'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/blog/[slug]
 * Delete a blog post
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const session = await getSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to delete blog posts'
      }, { status: 401 })
    }

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { authorId: true, title: true }
    })

    if (!post) {
      return NextResponse.json({
        success: false,
        error: 'Blog post not found',
        message: 'The requested blog post does not exist'
      }, { status: 404 })
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
    if (post.authorId !== session.userId && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to delete this post'
      }, { status: 403 })
    }

    await prisma.blogPost.delete({
      where: { slug }
    })

    // Revalidate paths
    revalidatePath('/dashboard/blog')
    revalidatePath('/blog')

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    })

  } catch (error) {
    console.error('Blog post deletion error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to delete blog post'
    }, { status: 500 })
  }
}
