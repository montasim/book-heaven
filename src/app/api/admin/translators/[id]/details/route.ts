import { NextRequest, NextResponse } from 'next/server'
import { getTranslatorWithCompleteDetails } from '@/lib/lms/repositories/translator.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/translators/[id]/details
 * Get comprehensive translator data for admin dashboard
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

    // Get translator with complete details
    const translator = await getTranslatorWithCompleteDetails(translatorId)

    if (!translator) {
      return NextResponse.json(
        { error: 'Translator not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: translator,
    })
  } catch (error) {
    console.error('Error fetching admin translator details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch translator details' },
      { status: 500 }
    )
  }
}
