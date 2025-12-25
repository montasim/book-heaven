import { NextRequest, NextResponse } from 'next/server'
import { getAuthorBooksWithStats } from '@/lib/lms/repositories/author.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/authors/[id]/books
 * Get books by an author with their statistics
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

    const books = await getAuthorBooksWithStats(authorId, {
      page,
      limit,
    })

    return NextResponse.json({
      data: books,
    })
  } catch (error) {
    console.error('Error fetching author books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch book data' },
      { status: 500 }
    )
  }
}
