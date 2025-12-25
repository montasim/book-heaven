import { NextRequest, NextResponse } from 'next/server'
import {
  getAuthorReaders,
  getAuthorReadingStats,
} from '@/lib/lms/repositories/author.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/authors/[id]/readers
 * Get reader information for an author across all their books
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const authorId = params.id

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
    const stats = await getAuthorReadingStats(authorId)

    // If only stats are requested, return early
    if (statsOnly) {
      return NextResponse.json({
        data: { stats },
      })
    }

    // Get readers list
    const readers = await getAuthorReaders(authorId, {
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
    console.error('Error fetching author readers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reader data' },
      { status: 500 }
    )
  }
}
