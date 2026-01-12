import { NextRequest, NextResponse } from 'next/server'
import { getTranslatorReaders } from '@/lib/lms/repositories/translator.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/translators/[id]/readers
 * Get readers across all books by a translator
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const translatorId = params.id

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

    // Get translator readers
    const result = await getTranslatorReaders(translatorId, { page, limit })

    return NextResponse.json({
      data: {
        readers: {
          readers: result.readers,
          total: result.total,
          pages: result.pages,
          currentPage: result.currentPage,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching translator readers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch translator readers' },
      { status: 500 }
    )
  }
}
