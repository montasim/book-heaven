'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import {
  getActivePricingTiers,
  getAllPricingTiers,
  upsertPricingTier,
  deletePricingTier,
  updatePricingTierStatus,
} from '@/lib/admin/repositories/pricing.repository'
import { SubscriptionPlan } from '@prisma/client'
import { z } from 'zod'

const pricingTierSchema = z.object({
  plan: z.enum(['FREE', 'PREMIUM', 'PREMIUM_PLUS']),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  monthlyPrice: z.number().int().min(0),
  yearlyPrice: z.number().int().min(0),
  popular: z.boolean(),
  stripeMonthlyPriceId: z.string().nullable().optional(),
  stripeYearlyPriceId: z.string().nullable().optional(),
  isActive: z.boolean(),
  order: z.number().int().min(0),
  features: z.array(
    z.object({
      text: z.string().min(1).max(200),
      included: z.boolean(),
      order: z.number().int().min(0),
    })
  ),
})

/**
 * GET /api/admin/pricing
 * Get all pricing tiers (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const tiers = includeInactive ? await getAllPricingTiers() : await getActivePricingTiers()

    return NextResponse.json({
      success: true,
      data: tiers,
    })
  } catch (error: any) {
    console.error('Get pricing tiers error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pricing tiers' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/pricing
 * Create or update a pricing tier (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = pricingTierSchema.parse(body)

    const tier = await upsertPricingTier(validatedData.plan as SubscriptionPlan, {
      name: validatedData.name,
      description: validatedData.description,
      monthlyPrice: validatedData.monthlyPrice,
      yearlyPrice: validatedData.yearlyPrice,
      popular: validatedData.popular,
      stripeMonthlyPriceId: validatedData.stripeMonthlyPriceId || undefined,
      stripeYearlyPriceId: validatedData.stripeYearlyPriceId || undefined,
      isActive: validatedData.isActive,
      order: validatedData.order,
      features: validatedData.features,
    })

    return NextResponse.json({
      success: true,
      data: tier,
      message: 'Pricing tier saved successfully',
    })
  } catch (error: any) {
    console.error('Save pricing tier error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Failed to save pricing tier' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/pricing
 * Delete a pricing tier (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const plan = searchParams.get('plan') as SubscriptionPlan

    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'Plan parameter is required' },
        { status: 400 }
      )
    }

    await deletePricingTier(plan)

    return NextResponse.json({
      success: true,
      message: 'Pricing tier deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete pricing tier error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete pricing tier' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/pricing
 * Update pricing tier status (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { plan, isActive } = body

    if (!plan || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Plan and isActive are required' },
        { status: 400 }
      )
    }

    const tier = await updatePricingTierStatus(plan as SubscriptionPlan, isActive)

    return NextResponse.json({
      success: true,
      data: tier,
      message: 'Pricing tier status updated successfully',
    })
  } catch (error: any) {
    console.error('Update pricing tier status error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update pricing tier status' },
      { status: 500 }
    )
  }
}
