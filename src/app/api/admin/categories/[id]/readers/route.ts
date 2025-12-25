import { NextRequest, NextResponse } from 'next/server'
import {
  getCategoryReaders,
  getCategoryReadingStats,
} from '@/lib/lms/repositories/category.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/categories/[id]/readers
 * Get reader information for a category across all its books
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const categoryId = params.id

    // Check authentication and admin role
    const session = await getSession()
    const user = session ? await findUserById(session.userId) : null
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const statsOnly = searchParams.get('statsOnly') === 'true'

    // Get reading stats
    const stats = await getCategoryReadingStats(categoryId)

    // If only stats are requested, return early
    if (statsOnly) {
      return NextResponse.json({
        data: { stats },
      })
    }

    // Get readers list
    const readers = await getCategoryReaders(categoryId, {
      page,
      limit,
    })

    return NextResponse.json({
      data: {
        stats,
        readers,
      },
    })
  } catch (error) {
    console.error('Error fetching category readers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reader data' },
      { status: 500 }
    )
  }
}
