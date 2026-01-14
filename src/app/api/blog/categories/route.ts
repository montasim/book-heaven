/**
 * Blog Categories API Route
 *
 * GET /api/blog/categories - List all categories (public)
 * POST /api/blog/categories - Create new category (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  order: z.number().default(0),
})

/**
 * GET /api/blog/categories
 * List all blog categories
 */
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { categories }
    })

  } catch (error) {
    console.error('Blog categories fetch error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories'
    }, { status: 500 })
  }
}

/**
 * POST /api/blog/categories
 * Create a new blog category
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to create categories'
      }, { status: 401 })
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'Only admins can create blog categories'
      }, { status: 403 })
    }

    const body = await request.json()
    const validated = CategorySchema.parse(body)

    // Check if slug is unique
    const existing = await prisma.blogCategory.findUnique({
      where: { slug: validated.slug }
    })

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Slug already exists',
        message: 'A category with this slug already exists'
      }, { status: 409 })
    }

    const category = await prisma.blogCategory.create({
      data: validated
    })

    return NextResponse.json({
      success: true,
      data: { category },
      message: 'Category created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Category creation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create category'
    }, { status: 500 })
  }
}
