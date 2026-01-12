import { NextRequest, NextResponse } from 'next/server'
import {
  getTranslatorViewStats,
  getTranslatorViewsByDate,
  getRecentTranslatorViews,
} from '@/lib/lms/repositories/translator.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/translators/[id]/visits
 * Get translator visit analytics
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
    const limit = parseInt(searchParams.get('limit') || '10')
    const chart = searchParams.get('chart') === 'true'

    // Get view stats
    const stats = await getTranslatorViewStats(translatorId)

    // If only chart data is requested
    if (chart) {
      // Get chart data for the last 30 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const chartData = await getTranslatorViewsByDate(translatorId, startDate, endDate)

      return NextResponse.json({
        data: {
          chart: chartData,
        },
      })
    }

    // Get recent visits
    const visits = await getRecentTranslatorViews(translatorId, limit)

    return NextResponse.json({
      data: {
        visits: {
          visits: visits,
          total: visits.length,
        },
        stats,
      },
    })
  } catch (error) {
    console.error('Error fetching translator visits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch translator visits' },
      { status: 500 }
    )
  }
}
