/**
 * Quiz Questions API Route
 *
 * Fetches quiz questions from Open Trivia Database API
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { config } from '@/config'

const QuestionsSchema = z.object({
  amount: z.enum(['5', '10', '15']).default('10'),
  category: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  type: z.enum(['multiple', 'boolean']).default('multiple'),
})

/**
 * GET /api/user/quiz/questions
 *
 * Fetch quiz questions from OpenTDB API
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams)

    const validated = QuestionsSchema.parse(params)

    // Build query
    const queryParams = new URLSearchParams({
      amount: validated.amount,
      type: validated.type,
    })

    if (validated.category) {
      queryParams.set('category', validated.category)
    }
    if (validated.difficulty) {
      queryParams.set('difficulty', validated.difficulty)
    }

    // Fetch from OpenTDB API
    const response = await fetch(
      `${config.quiz.apiBaseUrl}/api.php?${queryParams.toString()}`,
      {
        signal: AbortSignal.timeout(config.quiz.timeout),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch quiz questions')
    }

    const data = await response.json()

    if (data.response_code !== 0) {
      throw new Error('Quiz API returned error')
    }

    // Shuffle answers (correct + incorrect)
    const questions = data.results.map((q: any) => {
      const allAnswers = [...q.incorrect_answers, q.correct_answer]
        .map((answer: string) => decodeURIComponent(answer))
        .sort(() => Math.random() - 0.5)

      return {
        ...q,
        question: decodeURIComponent(q.question),
        correct_answer: decodeURIComponent(q.correct_answer),
        incorrect_answers: q.incorrect_answers.map(decodeURIComponent),
        allAnswers,
      }
    })

    return NextResponse.json({
      success: true,
      data: { questions },
    })
  } catch (error) {
    console.error('Fetch quiz questions error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch quiz questions',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
