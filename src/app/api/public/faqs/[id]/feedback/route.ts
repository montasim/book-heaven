'use server'

import { NextRequest, NextResponse } from 'next/server'
import { incrementFaqViews, submitFaqFeedback } from '@/lib/support/support.repository'

/**
 * POST /api/public/faqs/:id/feedback
 * Submit helpful/not helpful feedback for an FAQ
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { helpful } = body

    if (typeof helpful !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Invalid feedback value' },
        { status: 400 }
      )
    }

    await submitFaqFeedback(params.id, helpful)

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
    })
  } catch (error: any) {
    console.error('Submit FAQ feedback error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/public/faqs/:id
 * Increment FAQ view count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await incrementFaqViews(params.id)

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('Increment FAQ views error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to record view' },
      { status: 500 }
    )
  }
}
