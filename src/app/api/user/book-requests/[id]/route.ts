'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/session'
import { RequestStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

/**
 * GET /api/user/book-requests/[id]
 * Get a specific book request by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await params

    const bookRequest = await prisma.bookRequest.findUnique({
      where: { id },
    })

    if (!bookRequest) {
      return NextResponse.json(
        { success: false, message: 'Book request not found' },
        { status: 404 }
      )
    }

    // Only allow users to view their own requests
    if (bookRequest.requestedById !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: bookRequest,
    })
  } catch (error: any) {
    console.error('Get book request error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch book request' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/book-requests/[id]
 * Update a book request (for users to cancel their requests)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status, cancelReason } = body

    // Get the existing request
    const existingRequest = await prisma.bookRequest.findUnique({
      where: { id },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, message: 'Book request not found' },
        { status: 404 }
      )
    }

    // Only allow users to update their own requests
    if (existingRequest.requestedById !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Users can only cancel pending requests
    if (existingRequest.status !== RequestStatus.PENDING) {
      return NextResponse.json(
        { success: false, message: 'Can only cancel pending requests' },
        { status: 400 }
      )
    }

    // Users can only cancel their requests
    if (status !== RequestStatus.REJECTED) {
      return NextResponse.json(
        { success: false, message: 'Users can only cancel requests' },
        { status: 400 }
      )
    }

    // Require cancel reason when rejecting
    if (!cancelReason || !cancelReason.trim()) {
      return NextResponse.json(
        { success: false, message: 'Please provide a reason for cancelling this request' },
        { status: 400 }
      )
    }

    // Update the request
    const updatedRequest = await prisma.bookRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        cancelReason: cancelReason.trim(),
        cancelledById: session.userId,
      },
    })

    revalidatePath('/library/my-requests')
    revalidatePath('/dashboard/book-requests')

    return NextResponse.json({
      success: true,
      message: 'Book request cancelled',
      data: updatedRequest,
    })
  } catch (error: any) {
    console.error('Update book request error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update book request' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/book-requests/[id]
 * Delete a book request (optional - for users to delete their cancelled requests)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get the existing request
    const existingRequest = await prisma.bookRequest.findUnique({
      where: { id },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, message: 'Book request not found' },
        { status: 404 }
      )
    }

    // Only allow users to delete their own requests
    if (existingRequest.requestedById !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Only allow deleting cancelled/rejected requests
    if (existingRequest.status === RequestStatus.PENDING ||
        existingRequest.status === RequestStatus.IN_PROGRESS) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete active requests' },
        { status: 400 }
      )
    }

    await prisma.bookRequest.delete({
      where: { id },
    })

    revalidatePath('/library/my-requests')

    return NextResponse.json({
      success: true,
      message: 'Book request deleted',
    })
  } catch (error: any) {
    console.error('Delete book request error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete book request' },
      { status: 500 }
    )
  }
}
