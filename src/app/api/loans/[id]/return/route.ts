/**
 * Return Book API Route
 *
 * Handles marking a book as returned
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'

/**
 * POST /api/loans/[id]/return
 *
 * Mark a book as returned
 */
export async function POST(
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
        message: 'You must be logged in to return a book'
      }, { status: 401 })
    }

    // Check if loan exists
    const loan = await prisma.bookLoan.findUnique({
      where: { id },
      include: {
        book: {
          select: { id: true, name: true, image: true }
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, username: true }
        },
        lentBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
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

    // Check permission (admin or the borrower can return)
    if (userSession.role === 'USER' && loan.userId !== userSession.userId) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to return this book'
      }, { status: 403 })
    }

    // Can only return active or overdue loans
    if (loan.status !== 'ACTIVE' && loan.status !== 'OVERDUE') {
      return NextResponse.json({
        success: false,
        error: 'Invalid loan status',
        message: 'This book has already been returned or cancelled'
      }, { status: 400 })
    }

    // Mark as returned
    const returnedLoan = await prisma.bookLoan.update({
      where: { id },
      data: {
        status: 'RETURNED',
        returnDate: new Date()
      },
      include: {
        book: {
          select: { id: true, name: true, image: true }
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, username: true }
        },
        lentBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    })

    // Send email notifications (background task)
    // Email to user confirming return
    fetch('/api/loans/email/returned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loanId: loan.id,
        userId: loan.user.id
      })
    }).catch(err => console.error('Failed to send returned email:', err))

    return NextResponse.json({
      success: true,
      data: { loan: returnedLoan },
      message: 'Book returned successfully'
    })

  } catch (error) {
    console.error('Return book error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to return book',
      message: 'An error occurred while returning the book'
    }, { status: 500 })
  }
}
