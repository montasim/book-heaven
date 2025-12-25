import { NextRequest, NextResponse } from 'next/server'
import { getPublicationBooksWithStats } from '@/lib/lms/repositories/publication.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/publications/[id]/books
 * Get all books by a publication with their stats
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const publicationId = params.id

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

    const booksData = await getPublicationBooksWithStats(publicationId, {
      page,
      limit,
    })

    return NextResponse.json({
      data: booksData,
    })
  } catch (error) {
    console.error('Error fetching publication books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    )
  }
}
