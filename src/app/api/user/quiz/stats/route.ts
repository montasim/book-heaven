/**
 * Quiz Stats API Route
 *
 * Get user's quiz statistics
 */

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getUserQuizStats } from '@/lib/user/repositories/quiz.repository'

/**
 * GET /api/user/quiz/stats
 *
 * Get current user's quiz statistics
 */
export async function GET() {
  try {
    const session = await requireAuth()

    const stats = await getUserQuizStats(session.userId)

    return NextResponse.json({
      success: true,
      data: { stats },
    })
  } catch (error) {
    console.error('Get quiz stats error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to get quiz stats',
    }, { status: 500 })
  }
}
