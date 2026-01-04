'use server'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { bulkUpsertFAQs } from '@/lib/admin/repositories/faq.repository'

/**
 * POST /api/admin/faq/seed
 * Seed initial FAQ data (admin only)
 */
export async function POST() {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const initialFAQs = [
      {
        question: "Can I change my plan later?",
        answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, you'll receive credit towards future billing periods.",
        category: "pricing",
        isActive: true,
        order: 0,
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards including Visa, Mastercard, American Express, and Discover. Payments are processed securely through Stripe.",
        category: "pricing",
        isActive: true,
        order: 1,
      },
      {
        question: "Is there a free trial?",
        answer: "We offer a 14-day free trial for both Premium and Premium Plus plans. You can explore all premium features before committing to a subscription.",
        category: "pricing",
        isActive: true,
        order: 2,
      },
      {
        question: "Can I cancel anytime?",
        answer: "Absolutely! You can cancel your subscription at any time. Your access will continue until the end of your current billing period.",
        category: "pricing",
        isActive: true,
        order: 3,
      },
      {
        question: "How do I access my books?",
        answer: "Once you subscribe, you'll have instant access to our entire library through your account. You can read on any device with our responsive design.",
        category: "reading",
        isActive: true,
        order: 4,
      },
      {
        question: "Are there any hidden fees?",
        answer: "No! The price you see is the price you pay. There are no setup fees, cancellation fees, or hidden charges. What you see in your pricing plan is exactly what you'll be billed.",
        category: "pricing",
        isActive: true,
        order: 5,
      },
      {
        question: "Can I share my account?",
        answer: "Each subscription is for individual use. If you're interested in team or family plans, please contact our support for custom solutions.",
        category: "account",
        isActive: true,
        order: 6,
      },
      {
        question: "What if I need technical support?",
        answer: "Our support team is available 24/7 to help you with any technical issues. You can reach us through the contact form in your account settings.",
        category: "technical",
        isActive: true,
        order: 7,
      },
    ]

    await bulkUpsertFAQs(initialFAQs)

    return NextResponse.json({
      success: true,
      message: 'FAQs seeded successfully',
    })
  } catch (error: any) {
    console.error('Seed FAQs error:', error)
    return NextResponse.json({ success: false, message: 'Failed to seed FAQs' }, { status: 500 })
  }
}
