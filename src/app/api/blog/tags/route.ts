/**
 * Blog Tags API Route
 *
 * GET /api/blog/tags - List all tags (public)
 * POST /api/blog/tags - Create new tag (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const TagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
})

/**
 * GET /api/blog/tags
 * List all blog tags
 */
export async function GET(request: NextRequest) {
  try {
    const tags = await prisma.blogTag.findMany({
      include: {
        _count: {
          select: { posts: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { tags }
    })

  } catch (error) {
    console.error('Blog tags fetch error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tags'
    }, { status: 500 })
  }
}

/**
 * POST /api/blog/tags
 * Create a new blog tag
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to create tags'
      }, { status: 401 })
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'Only admins can create blog tags'
      }, { status: 403 })
    }

    const body = await request.json()
    const validated = TagSchema.parse(body)

    // Check if slug is unique
    const existing = await prisma.blogTag.findUnique({
      where: { slug: validated.slug }
    })

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Slug already exists',
        message: 'A tag with this slug already exists'
      }, { status: 409 })
    }

    const tag = await prisma.blogTag.create({
      data: validated
    })

    return NextResponse.json({
      success: true,
      data: { tag },
      message: 'Tag created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Tag creation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create tag'
    }, { status: 500 })
  }
}
