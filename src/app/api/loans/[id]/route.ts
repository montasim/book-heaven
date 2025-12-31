/**
 * Single Book Loan API Route
 *
 * Handles viewing, returning, updating, and canceling individual loans
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'

/**
 * GET /api/loans/[id]
 *
 * Get details of a specific loan
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Require authentication
    const userSession = await getSession()
    if (!userSession) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to view loan details'
      }, { status: 401 })
    }

    // Fetch loan
    const loan = await prisma.bookLoan.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            id: true,
            name: true,
            image: true,
            type: true,
            numberOfCopies: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true
          }
        },
        lentBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!loan) {
      return NextResponse.json({
        success: false,
        error: 'Loan not found',
        message: 'The requested loan does not exist'
      }, { status: 404 })
    }

    // Check permission (only admin or the borrower can view)
    if (userSession.role === 'USER' && loan.userId !== userSession.userId) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to view this loan'
      }, { status: 403 })
    }

    // Update overdue status if needed
    const now = new Date()
    if (loan.status === 'ACTIVE' && loan.dueDate < now) {
      const updated = await prisma.bookLoan.update({
        where: { id },
        data: { status: 'OVERDUE' },
        include: {
          book: {
            select: {
              id: true,
              name: true,
              image: true,
              type: true,
              numberOfCopies: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true
            }
          },
          lentBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
      return NextResponse.json({
        success: true,
        data: { loan: updated },
        message: 'Loan details retrieved successfully'
      })
    }

    return NextResponse.json({
      success: true,
      data: { loan },
      message: 'Loan details retrieved successfully'
    })

  } catch (error) {
    console.error('Get loan error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve loan',
      message: 'An error occurred while fetching loan details'
    }, { status: 500 })
  }
}

/**
 * PUT /api/loans/[id]
 *
 * Update a loan (extend due date, update notes, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Require authentication
    const userSession = await getSession()
    if (!userSession) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to update a loan'
      }, { status: 401 })
    }

    // Check if loan exists
    const loan = await prisma.bookLoan.findUnique({
      where: { id }
    })

    if (!loan) {
      return NextResponse.json({
        success: false,
        error: 'Loan not found',
        message: 'The requested loan does not exist'
      }, { status: 404 })
    }

    // Only admins can update loans
    if (userSession.role === 'USER') {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only admins can update loans'
      }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { dueDate, notes } = body

    // Build update data
    const updateData: any = {}

    if (dueDate) {
      const parsedDueDate = new Date(dueDate)
      if (isNaN(parsedDueDate.getTime()) || parsedDueDate <= new Date()) {
        return NextResponse.json({
          success: false,
          error: 'Invalid due date',
          message: 'Due date must be in the future'
        }, { status: 400 })
      }
      updateData.dueDate = parsedDueDate
    }

    if (notes !== undefined) {
      updateData.notes = notes || null
    }

    // Update loan
    const updatedLoan = await prisma.bookLoan.update({
      where: { id },
      data: updateData,
      include: {
        book: {
          select: {
            id: true,
            name: true,
            image: true,
            type: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true
          }
        },
        lentBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { loan: updatedLoan },
      message: 'Loan updated successfully'
    })

  } catch (error) {
    console.error('Update loan error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to update loan',
      message: 'An error occurred while updating the loan'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/loans/[id]
 *
 * Cancel a loan (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Require authentication
    const userSession = await getSession()
    if (!userSession) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to cancel a loan'
      }, { status: 401 })
    }

    // Only admins can cancel loans
    if (userSession.role === 'USER') {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only admins can cancel loans'
      }, { status: 403 })
    }

    // Check if loan exists
    const loan = await prisma.bookLoan.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } }
      }
    })

    if (!loan) {
      return NextResponse.json({
        success: false,
        error: 'Loan not found',
        message: 'The requested loan does not exist'
      }, { status: 404 })
    }

    // Can only cancel active loans
    if (loan.status !== 'ACTIVE' && loan.status !== 'OVERDUE') {
      return NextResponse.json({
        success: false,
        error: 'Invalid loan status',
        message: 'Can only cancel active or overdue loans'
      }, { status: 400 })
    }

    // Cancel the loan
    await prisma.bookLoan.update({
      where: { id },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({
      success: true,
      message: 'Loan cancelled successfully'
    })

  } catch (error) {
    console.error('Cancel loan error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to cancel loan',
      message: 'An error occurred while cancelling the loan'
    }, { status: 500 })
  }
}
