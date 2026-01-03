/**
 * Stripe Webhook Handler API Route
 *
 * POST /api/stripe/webhook
 *
 * Handles incoming webhook events from Stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import {
  constructWebhookEvent,
  handleCheckoutSessionCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
} from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event
    try {
      event = await constructWebhookEvent(body, signature)
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`Processing webhook event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as any)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as any)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as any)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as any)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as any)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
