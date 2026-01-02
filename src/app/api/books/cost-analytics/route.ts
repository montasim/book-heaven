'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import {
  getCostSummary,
  getCostsOverTime,
  getCostsByDimension,
  getTopCosts,
  getCostActivitySummary,
  getCostDetails
} from '@/lib/books/repositories/cost-analytics.repository'
import type { DateRangeType, GroupByType } from '@/types/book-cost-analytics'

/**
 * GET /api/books/cost-analytics
 * Get book cost analytics (user - only their own books)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dateRange = (searchParams.get('dateRange') as DateRangeType) || '30d'
    const groupBy = (searchParams.get('groupBy') as GroupByType) || 'category'
    const timePeriod = (searchParams.get('timePeriod') as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'daily'
    const page = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('pageSize')) || 20

    // Calculate days from date range
    const days = dateRange === 'all' ? 0 : dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30

    // Parallel queries for performance
    const [
      summary,
      costsOverTime,
      costsByDimension,
      topCosts,
      activitySummary,
      detailedBreakdown
    ] = await Promise.all([
      getCostSummary(session.userId),
      getCostsOverTime(session.userId, days, timePeriod),
      getCostsByDimension(session.userId, groupBy, 20),
      getTopCosts(session.userId, 10),
      getCostActivitySummary(session.userId),
      getCostDetails(session.userId, page, pageSize, 'purchaseDate', 'desc')
    ])

    return NextResponse.json({
      success: true,
      data: {
        summary,
        costsOverTime,
        costsByDimension,
        topCosts,
        activitySummary,
        detailedBreakdown: detailedBreakdown.items,
        pagination: {
          page,
          pageSize,
          total: detailedBreakdown.total
        }
      },
      message: 'Your book cost analytics retrieved successfully'
    })
  } catch (error: any) {
    console.error('Get book cost analytics error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch cost analytics' },
      { status: 500 }
    )
  }
}
