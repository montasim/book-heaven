/**
 * Book Loans API Route
 *
 * Handles listing and managing book loans
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'

/**
 * GET /api/loans
 *
 * Get list of loans (filtered based on user role)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const userSession = await getSession()
    if (!userSession) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to view loans'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')?.toUpperCase()
    const userId = searchParams.get('userId')
    const bookId = searchParams.get('bookId')

    // Build where clause based on user role
    let whereClause: any = {}

    // Regular users can only see their own loans
    if (userSession.role === 'USER') {
      whereClause.userId = userSession.userId
    }
    // Admins can filter by specific user or see all
    else if (userId) {
      whereClause.userId = userId
    }

    // Apply filters
    if (status && ['ACTIVE', 'RETURNED', 'OVERDUE', 'CANCELLED'].includes(status)) {
      whereClause.status = status
    }

    if (bookId) {
      whereClause.bookId = bookId
    }

    // Fetch loans
    const loans = await prisma.bookLoan.findMany({
      where: whereClause,
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
      },
      orderBy: { loanDate: 'desc' }
    })

    // Update overdue status for active loans
    const now = new Date()
    const loansWithStatus = await Promise.all(
      loans.map(async (loan) => {
        if (loan.status === 'ACTIVE' && loan.dueDate < now) {
          // Update to OVERDUE
          const updated = await prisma.bookLoan.update({
            where: { id: loan.id },
            data: { status: 'OVERDUE' },
            include: {
              book: { select: { id: true, name: true, image: true, type: true } },
              user: { select: { id: true, firstName: true, lastName: true, email: true, username: true } },
              lentBy: { select: { id: true, firstName: true, lastName: true, email: true } }
            }
          })
          return updated
        }
        return loan
      })
    )

    return NextResponse.json({
      success: true,
      data: { loans: loansWithStatus },
      message: 'Loans retrieved successfully'
    })

  } catch (error) {
    console.error('Get loans error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve loans',
      message: 'An error occurred while fetching loans'
    }, { status: 500 })
  }
}
