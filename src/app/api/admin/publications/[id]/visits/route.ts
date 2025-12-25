import { NextRequest, NextResponse } from 'next/server'
import {
  getPublicationViews,
  getPublicationViewStats,
  getPublicationViewsByDate,
} from '@/lib/lms/repositories/publication-view.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/publications/[id]/visits
 * Get visit analytics data for a publication
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const chart = searchParams.get('chart') === 'true'

    // Get aggregate stats
    const stats = await getPublicationViewStats(publicationId)

    // If chart data is requested, return views by date
    if (chart) {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default 30 days
      const end = endDate ? new Date(endDate) : new Date()

      const chartData = await getPublicationViewsByDate(publicationId, start, end)

      return NextResponse.json({
        data: {
          stats,
          chart: chartData,
        },
      })
    }

    // Otherwise, return paginated visit list
    const visits = await getPublicationViews(publicationId, {
      page,
      limit,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      userId: userId || undefined,
    })

    return NextResponse.json({
      data: {
        stats,
        visits,
      },
    })
  } catch (error) {
    console.error('Error fetching publication visits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visit data' },
      { status: 500 }
    )
  }
}
