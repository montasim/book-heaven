import { NextRequest, NextResponse } from 'next/server'
import { getAuthorWithCompleteDetails } from '@/lib/lms/repositories/author.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/authors/[id]/details
 * Get comprehensive author data for admin dashboard
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

    // Get author with complete details
    const author = await getAuthorWithCompleteDetails(authorId)

    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: author,
    })
  } catch (error) {
    console.error('Error fetching admin author details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch author details' },
      { status: 500 }
    )
  }
}
