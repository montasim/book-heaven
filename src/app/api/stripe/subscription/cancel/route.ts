/**
 * Cancel Subscription API Route
 *
 * POST /api/stripe/subscription/cancel
 *
 * Cancels the user's subscription at period end
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { findSubscriptionByUserId } from '@/lib/user/repositories/subscription.repository'
import { cancelSubscriptionAtPeriodEnd } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await findSubscriptionByUserId(session.userId)

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Cancel at period end
    await cancelSubscriptionAtPeriodEnd(subscription.stripeSubscriptionId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
