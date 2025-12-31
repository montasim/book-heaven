/**
 * Lend Book API Route
 *
 * Allows admins to lend books to users for a specific time period
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'

/**
 * POST /api/books/[id]/lend
 *
 * Lend a book to a user (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params

    // Require authentication
    const userSession = await getSession()
    if (!userSession) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to lend books'
      }, { status: 401 })
    }

    // Check if user is admin
    if (userSession.role === 'USER') {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only admins can lend books'
      }, { status: 403 })
    }

    // Validate book ID
    if (!bookId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid book ID',
        message: 'Book ID is required'
      }, { status: 400 })
    }

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, name: true, type: true, numberOfCopies: true }
    })

    if (!book) {
      return NextResponse.json({
        success: false,
        error: 'Book not found',
        message: 'The requested book does not exist'
      }, { status: 404 })
    }

    // Only hard copy books can be lent
    if (book.type !== 'HARD_COPY') {
      return NextResponse.json({
        success: false,
        error: 'Invalid book type',
        message: 'Only hard copy books can be lent physically'
      }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const { userId, dueDate, notes } = body

    // Validate user ID
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID required',
        message: 'User ID is required to lend a book'
      }, { status: 400 })
    }

    // Validate due date
    if (!dueDate) {
      return NextResponse.json({
        success: false,
        error: 'Due date required',
        message: 'Due date is required'
      }, { status: 400 })
    }

    const parsedDueDate = new Date(dueDate)
    if (isNaN(parsedDueDate.getTime()) || parsedDueDate <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Invalid due date',
        message: 'Due date must be in the future'
      }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, username: true }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'The specified user does not exist'
      }, { status: 404 })
    }

    // Check if user already has an active loan for this book
    const existingLoan = await prisma.bookLoan.findFirst({
      where: {
        bookId,
        userId,
        status: { in: ['ACTIVE', 'OVERDUE'] }
      }
    })

    if (existingLoan) {
      return NextResponse.json({
        success: false,
        error: 'Active loan exists',
        message: 'This user already has an active loan for this book'
      }, { status: 409 })
    }

    // Check number of available copies
    if (book.numberOfCopies !== null) {
      const activeLoansCount = await prisma.bookLoan.count({
        where: {
          bookId,
          status: { in: ['ACTIVE', 'OVERDUE'] }
        }
      })

      if (activeLoansCount >= book.numberOfCopies) {
        return NextResponse.json({
          success: false,
          error: 'No copies available',
          message: 'All copies of this book are currently lent out'
        }, { status: 400 })
      }
    }

    // Create the loan
    const loan = await prisma.bookLoan.create({
      data: {
        bookId,
        userId,
        lentById: userSession.userId,
        dueDate: parsedDueDate,
        notes: notes || null,
        status: 'ACTIVE'
      },
      include: {
        book: {
          select: { id: true, name: true, image: true, type: true }
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, username: true }
        },
        lentBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    })

    // Send email notification to user (background task)
    fetch('/api/loans/email/borrowed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loanId: loan.id,
        userId: user.id
      })
    }).catch(err => console.error('Failed to send borrowed email:', err))

    return NextResponse.json({
      success: true,
      data: { loan },
      message: 'Book lent successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Lend book error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to lend book',
      message: 'An error occurred while lending the book'
    }, { status: 500 })
  }
}
