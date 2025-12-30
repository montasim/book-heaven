'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { addResponse } from '@/lib/support/support.repository'
import { isAdmin } from '@/lib/auth/validation'

/**
 * POST /api/admin/support-tickets/:id/respond
 * Add a response to a ticket (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!isAdmin(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { message, attachments } = body

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      )
    }

    const response = await addResponse({
      ticketId: params.id,
      senderId: session.userId,
      senderRole: session.role,
      isFromAdmin: true,
      message,
      attachments,
    })

    return NextResponse.json({
      success: true,
      message: 'Response added successfully',
      data: { response },
    })
  } catch (error: any) {
    console.error('Add response error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add response' },
      { status: 500 }
    )
  }
}
