'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'
import { RequestStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED']),
  cancelReason: z.string().optional(),
})

/**
 * GET /api/admin/book-requests/[id]
 * Get a specific book request (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const { id } = await params

    const bookRequest = await prisma.bookRequest.findUnique({
      where: { id },
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!bookRequest) {
      return NextResponse.json(
        { success: false, message: 'Book request not found' },
        { status: 404 }
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
 * PATCH /api/admin/book-requests/[id]
 * Update book request status (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validation = updateStatusSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      )
    }

    const existingRequest = await prisma.bookRequest.findUnique({
      where: { id },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, message: 'Book request not found' },
        { status: 404 }
      )
    }

    // If rejecting, require a cancel reason
    if (validation.data.status === 'REJECTED' && !validation.data.cancelReason) {
      return NextResponse.json(
        { success: false, message: 'Please provide a reason for rejecting this request' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = { status: validation.data.status }

    // If rejecting, add cancel reason and set cancelledBy to ADMIN
    if (validation.data.status === 'REJECTED') {
      updateData.cancelReason = validation.data.cancelReason?.trim()
      updateData.cancelledBy = 'ADMIN'
    }

    // Update the request
    const updatedRequest = await prisma.bookRequest.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/dashboard/book-requests')
    revalidatePath('/library/my-requests')

    return NextResponse.json({
      success: true,
      message: `Request ${validation.data.status.toLowerCase()}`,
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
 * DELETE /api/admin/book-requests/[id]
 * Delete a book request (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const { id } = await params

    await prisma.bookRequest.delete({
      where: { id },
    })

    revalidatePath('/dashboard/book-requests')
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
