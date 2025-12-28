/**
 * Admin Series Books API Route
 *
 * Get books in a series
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import * as seriesRepository from '@/lib/lms/repositories/series.repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/series/[id]/books
 *
 * Get all books in a series ordered by series order
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const books = await seriesRepository.getSeriesBooks(id)

    return NextResponse.json({
      success: true,
      data: books,
    })
  } catch (error) {
    console.error('Get series books error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch series books' },
      { status: 500 }
    )
  }
}
