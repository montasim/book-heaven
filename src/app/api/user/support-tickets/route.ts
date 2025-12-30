'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getTickets, createTicket } from '@/lib/support/support.repository'
import { TicketPriority } from '@prisma/client'

/**
 * GET /api/user/support-tickets
 * Get current user's support tickets
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { tickets, total } = await getTickets({
      userId: session.userId,
    })

    return NextResponse.json({
      success: true,
      data: { tickets, total },
    })
  } catch (error: any) {
    console.error('Get user tickets error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/support-tickets
 * Create a new support ticket
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subject, description, category, priority } = body

    // Validation
    if (!subject?.trim() || !description?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Subject and description are required' },
        { status: 400 }
      )
    }

    if (!category || !priority) {
      return NextResponse.json(
        { success: false, message: 'Category and priority are required' },
        { status: 400 }
      )
    }

    const validPriorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { success: false, message: 'Invalid priority value' },
        { status: 400 }
      )
    }

    const ticket = await createTicket({
      userId: session.userId,
      userEmail: session.email,
      userName: session.name,
      subject,
      description,
      category,
      priority,
    })

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      data: { ticket },
    })
  } catch (error: any) {
    console.error('Create ticket error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}
