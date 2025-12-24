/**
 * Quiz Categories API Route
 *
 * Fetches available quiz categories from Open Trivia Database API
 */

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { config } from '@/config'

/**
 * GET /api/user/quiz/categories
 *
 * Fetch available quiz categories from OpenTDB API
 */
export async function GET() {
  try {
    await requireAuth()

    const response = await fetch(
      `${config.quiz.apiBaseUrl}/api_category.php`,
      {
        signal: AbortSignal.timeout(config.quiz.timeout),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: { categories: data.trivia_categories },
    })
  } catch (error) {
    console.error('Fetch categories error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories',
    }, { status: 500 })
  }
}
