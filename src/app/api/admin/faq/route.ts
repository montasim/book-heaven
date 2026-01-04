'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getActiveFAQs, getAllFAQs, bulkUpsertFAQs, deleteFAQ } from '@/lib/admin/repositories/faq.repository'
import { z } from 'zod'

const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  category: z.string().min(1).default('general'),
  isActive: z.boolean(),
  order: z.number().int().min(0),
})

const bulkFAQSchema = z.array(faqSchema)

/**
 * GET /api/admin/faq
 * Get all FAQs (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const faqs = includeInactive ? await getAllFAQs() : await getActiveFAQs()

    return NextResponse.json({
      success: true,
      data: faqs,
    })
  } catch (error: any) {
    console.error('Get FAQs error:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch FAQs' }, { status: 500 })
  }
}

/**
 * POST /api/admin/faq
 * Bulk upsert FAQs (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = bulkFAQSchema.parse(body)

    const faqs = await bulkUpsertFAQs(validatedData)

    return NextResponse.json({
      success: true,
      data: faqs,
      message: 'FAQs saved successfully',
    })
  } catch (error: any) {
    console.error('Save FAQs error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: false, message: 'Failed to save FAQs' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/faq
 * Delete a FAQ (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID parameter is required' }, { status: 400 })
    }

    await deleteFAQ(id)

    return NextResponse.json({
      success: true,
      message: 'FAQ deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete FAQ error:', error)
    return NextResponse.json({ success: false, message: 'Failed to delete FAQ' }, { status: 500 })
  }
}
