import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBookById } from '@/lib/lms/repositories/book.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/admin/books/[id]/processing-complete
 * Mark PDF processing as complete (called by PDF processor)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const bookId = params.id
    const body = await request.json()

    // Check authentication with API key (for PDF processor) or session (for admin)
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.PDF_PROCESSOR_API_KEY

    // Allow PDF processor with API key
    if (authHeader === `Bearer ${apiKey}`) {
      // PDF processor authentication successful
    } else {
      // Fall back to session authentication for admin users
      const session = await getSession()
      const user = session ? await findUserById(session.userId) : null
      if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    // Check if book exists
    const existingBook = await getBookById(bookId)

    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Processing status is now handled by the PDF processor's pdfProcessingJob table
    // This endpoint is kept for compatibility but doesn't need to update the Book
    // The PDF processor updates extractionStatus, aiSummaryStatus, questionsStatus directly

    return NextResponse.json({
      success: true,
      message: 'Processing complete acknowledged',
    })
  } catch (error) {
    console.error('Error marking processing as complete:', error)
    return NextResponse.json(
      { error: 'Failed to mark processing as complete' },
      { status: 500 }
    )
  }
}
