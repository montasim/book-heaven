/**
 * Quiz Leaderboard API Route
 *
 * Get global quiz leaderboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { getQuizLeaderboard } from '@/lib/user/repositories/quiz.repository'

const LeaderboardSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
})

/**
 * GET /api/user/quiz/leaderboard
 *
 * Get global quiz leaderboard ranked by combined score
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const { limit } = LeaderboardSchema.parse(Object.fromEntries(searchParams))

    const leaderboard = await getQuizLeaderboard(limit)

    return NextResponse.json({
      success: true,
      data: { leaderboard },
    })
  } catch (error) {
    console.error('Get leaderboard error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to get leaderboard',
    }, { status: 500 })
  }
}
