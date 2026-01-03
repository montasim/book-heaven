/**
 * Get Subscription Status API Route
 *
 * GET /api/stripe/subscription
 *
 * Returns the current user's subscription details
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { findSubscriptionByUserId } from '@/lib/user/repositories/subscription.repository'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await findSubscriptionByUserId(session.userId)

    if (!subscription) {
      return NextResponse.json({
        plan: 'FREE',
        isActive: true,
        endDate: null,
      })
    }

    return NextResponse.json({
      plan: subscription.plan,
      isActive: subscription.isActive,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    })
  } catch (error: any) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
