import { NextResponse } from 'next/server'
import { getActiveFAQs } from '@/lib/admin/repositories/faq.repository'

/**
 * GET /api/faq
 * Get all active FAQs (public)
 */
export async function GET() {
  try {
    const faqs = await getActiveFAQs()

    return NextResponse.json({
      success: true,
      data: faqs,
    })
  } catch (error: any) {
    console.error('Get FAQs error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch FAQs' },
      { status: 500 }
    )
  }
}
