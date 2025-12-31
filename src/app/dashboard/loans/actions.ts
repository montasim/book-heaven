'use server'

import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getUserDisplayName } from '@/lib/utils/user'

// ============================================================================
// SCHEMAS
// ============================================================================

const loanSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  userId: z.string(),
  lentById: z.string(),
  loanDate: z.string(),
  dueDate: z.string(),
  returnDate: z.string().nullable(),
  status: z.enum(['ACTIVE', 'RETURNED', 'OVERDUE', 'CANCELLED']),
  notes: z.string().nullable(),
  reminderSent: z.boolean(),
  bookName: z.string(),
  bookImage: z.string().nullable(),
  bookType: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  lentByName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// Types
export type Loan = z.infer<typeof loanSchema>

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all loans
 */
export async function getLoans() {
  try {
    await requireAuth()

    const loans = await prisma.bookLoan.findMany({
      include: {
        book: {
          select: {
            id: true,
            name: true,
            image: true,
            type: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
        },
        lentBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        loanDate: 'desc',
      },
    })

    // Transform data for UI
    return loans.map((loan) => {
      const userName = getUserDisplayName({
        firstName: loan.user.firstName,
        lastName: loan.user.lastName,
        username: loan.user.username,
        name: '',
        email: loan.user.email,
      })

      const lentByName = getUserDisplayName({
        firstName: loan.lentBy.firstName,
        lastName: loan.lentBy.lastName,
        username: '',
        name: '',
        email: loan.lentBy.email,
      })

      // Calculate days remaining/overdue
      const dueDate = new Date(loan.dueDate)
      const now = new Date()
      const diffTime = dueDate.getTime() - now.getTime()
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return {
        id: loan.id,
        bookId: loan.bookId,
        userId: loan.userId,
        lentById: loan.lentById,
        loanDate: loan.loanDate.toISOString(),
        dueDate: loan.dueDate.toISOString(),
        returnDate: loan.returnDate?.toISOString() || null,
        status: loan.status,
        notes: loan.notes,
        reminderSent: loan.reminderSent,
        bookName: loan.book.name,
        bookImage: loan.book.image,
        bookType: loan.book.type,
        userName: userName,
        userEmail: loan.user.email,
        lentByName: lentByName,
        daysRemaining: daysRemaining,
        isOverdue: daysRemaining < 0 && loan.status === 'ACTIVE',
        createdAt: loan.createdAt.toISOString(),
        updatedAt: loan.updatedAt.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error fetching loans:', error)
    return []
  }
}

/**
 * Mark loan as returned
 */
export async function markAsReturned(loanId: string) {
  try {
    await requireAuth()

    const loan = await prisma.bookLoan.findUnique({
      where: { id: loanId },
      include: {
        book: true,
      },
    })

    if (!loan) {
      throw new Error('Loan not found')
    }

    // Update loan status
    const updatedLoan = await prisma.bookLoan.update({
      where: { id: loanId },
      data: {
        status: 'RETURNED',
        returnDate: new Date(),
      },
    })

    // Trigger return email
    try {
      await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/loans/email/returned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loanId,
          userId: loan.userId,
        }),
      })
    } catch (emailError) {
      console.error('Failed to send return email:', emailError)
    }

    return { message: 'Book marked as returned successfully' }
  } catch (error) {
    console.error('Error marking loan as returned:', error)
    throw error || new Error('Failed to mark loan as returned')
  }
}

/**
 * Cancel loan
 */
export async function cancelLoan(loanId: string) {
  try {
    await requireAuth()

    await prisma.bookLoan.update({
      where: { id: loanId },
      data: {
        status: 'CANCELLED',
      },
    })

    return { message: 'Loan cancelled successfully' }
  } catch (error) {
    console.error('Error cancelling loan:', error)
    throw error || new Error('Failed to cancel loan')
  }
}
