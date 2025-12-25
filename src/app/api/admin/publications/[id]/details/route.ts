import { NextRequest, NextResponse } from 'next/server'
import { getPublicationWithCompleteDetails } from '@/lib/lms/repositories/publication.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/publications/[id]/details
 * Get comprehensive publication data for admin dashboard
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

    // Get publication with complete details
    const publication = await getPublicationWithCompleteDetails(publicationId)

    if (!publication) {
      return NextResponse.json(
        { error: 'Publication not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: publication,
    })
  } catch (error) {
    console.error('Error fetching admin publication details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch publication details' },
      { status: 500 }
    )
  }
}
