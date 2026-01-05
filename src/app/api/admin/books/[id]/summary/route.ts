import { NextRequest, NextResponse } from 'next/server'
import { updateBookAISummary, getBookById } from '@/lib/lms/repositories/book.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * PATCH /api/admin/books/[id]/summary
 * Update book AI summary (called by PDF processor)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const bookId = params.id
    const body = await request.json()

    // Validate required fields
    const { summary } = body
    if (!summary) {
      return NextResponse.json(
        { error: 'Missing required field: summary' },
        { status: 400 }
      )
    }

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

    // Update AI summary
    await updateBookAISummary(bookId, {
      aiSummary: summary,
      aiSummaryStatus: 'COMPLETED',
    })

    return NextResponse.json({
      success: true,
      message: 'AI summary updated successfully',
    })
  } catch (error) {
    console.error('Error updating AI summary:', error)
    return NextResponse.json(
      { error: 'Failed to update AI summary' },
      { status: 500 }
    )
  }
}
