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
 * POST /api/admin/books/[id]/processing-error
 * Report PDF processing error (called by PDF processor)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const bookId = params.id
    const body = await request.json()

    // Validate required fields
    const { error } = body
    if (!error) {
      return NextResponse.json(
        { error: 'Missing required field: error' },
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

    // Update processing status to failed
    await prisma.book.update({
      where: { id: bookId },
      data: {
        processingStatus: 'FAILED',
        processingError: error,
        processingFailedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Error reported successfully',
    })
  } catch (error) {
    console.error('Error reporting processing error:', error)
    return NextResponse.json(
      { error: 'Failed to report processing error' },
      { status: 500 }
    )
  }
}
