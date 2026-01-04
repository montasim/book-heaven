import { NextResponse } from 'next/server'
import { getActivePricingTiers } from '@/lib/admin/repositories/pricing.repository'

/**
 * GET /api/pricing
 * Get all active pricing tiers (public)
 */
export async function GET() {
  try {
    const tiers = await getActivePricingTiers()

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
