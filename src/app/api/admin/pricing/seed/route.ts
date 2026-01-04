'use server'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import {
  upsertPricingTier,
} from '@/lib/admin/repositories/pricing.repository'
import { SubscriptionPlan } from '@prisma/client'

/**
 * POST /api/admin/pricing/seed
 * Seed initial pricing data (admin only)
 */
export async function POST() {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    // Seed FREE tier
    await upsertPricingTier(SubscriptionPlan.FREE, {
      name: 'Free',
      description: 'Perfect for exploring the platform',
      monthlyPrice: 0,
      yearlyPrice: 0,
      popular: false,
      stripeMonthlyPriceId: '',
      stripeYearlyPriceId: '',
      isActive: true,
      order: 0,
      features: [
        { text: 'Access to public library', included: true, order: 0 },
        { text: 'Basic book browsing', included: true, order: 1 },
        { text: 'Community features', included: true, order: 2 },
        { text: 'Up to 10 book uploads', included: true, order: 3 },
        { text: 'Ad-supported experience', included: true, order: 4 },
        { text: 'Unlimited book reading', included: false, order: 5 },
        { text: 'AI recommendations', included: false, order: 6 },
        { text: 'Advanced analytics', included: false, order: 7 },
        { text: 'Priority support', included: false, order: 8 },
        { text: 'Early access to new features', included: false, order: 9 },
      ],
    })

    // Seed PREMIUM tier
    await upsertPricingTier(SubscriptionPlan.PREMIUM, {
      name: 'Premium',
      description: 'For avid readers who want more',
      monthlyPrice: 999, // $9.99 in cents
      yearlyPrice: 9999, // $99.99 in cents
      popular: true,
      stripeMonthlyPriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
      stripeYearlyPriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
      isActive: true,
      order: 1,
      features: [
        { text: 'Everything in Free', included: true, order: 0 },
        { text: 'Unlimited book reading', included: true, order: 1 },
        { text: 'Up to 100 book uploads', included: true, order: 2 },
        { text: 'AI-powered recommendations', included: true, order: 3 },
        { text: 'Ad-free experience', included: true, order: 4 },
        { text: 'Advanced reading statistics', included: true, order: 5 },
        { text: 'Offline reading mode', included: true, order: 6 },
        { text: 'Custom bookmarks & highlights', included: true, order: 7 },
        { text: 'Priority support', included: false, order: 8 },
        { text: 'Early access to new features', included: false, order: 9 },
      ],
    })

    // Seed PREMIUM_PLUS tier
    await upsertPricingTier(SubscriptionPlan.PREMIUM_PLUS, {
      name: 'Premium Plus',
      description: 'Ultimate experience for power users',
      monthlyPrice: 1999, // $19.99 in cents
      yearlyPrice: 19999, // $199.99 in cents
      popular: false,
      stripeMonthlyPriceId: process.env.STRIPE_PREMIUM_PLUS_MONTHLY_PRICE_ID,
      stripeYearlyPriceId: process.env.STRIPE_PREMIUM_PLUS_YEARLY_PRICE_ID,
      isActive: true,
      order: 2,
      features: [
        { text: 'Everything in Premium', included: true, order: 0 },
        { text: 'Unlimited book uploads', included: true, order: 1 },
        { text: 'Priority support', included: true, order: 2 },
        { text: 'Early access to new features', included: true, order: 3 },
        { text: 'Advanced AI recommendations', included: true, order: 4 },
        { text: 'Bulk book operations', included: true, order: 5 },
        { text: 'API access', included: true, order: 6 },
        { text: 'Custom themes & fonts', included: true, order: 7 },
        { text: 'White-label options', included: true, order: 8 },
        { text: 'Dedicated account manager', included: true, order: 9 },
      ],
    })

    return NextResponse.json({
      success: true,
      message: 'Pricing tiers seeded successfully',
    })
  } catch (error: any) {
    console.error('Seed pricing tiers error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to seed pricing tiers' },
      { status: 500 }
    )
  }
}
