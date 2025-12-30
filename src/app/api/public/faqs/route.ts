'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getFaqs } from '@/lib/support/support.repository'

/**
 * GET /api/public/faqs
 * Get all active FAQs, optionally filtered by category
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined

    const faqs = await getFaqs(category)

    return NextResponse.json({
      success: true,
      data: { faqs },
    })
  } catch (error: any) {
    console.error('Get FAQs error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch FAQs' },
      { status: 500 }
    )
  }
}
