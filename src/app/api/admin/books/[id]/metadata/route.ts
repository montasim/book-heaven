import { NextRequest, NextResponse } from 'next/server'
import { updateBookMetadata, getBookById } from '@/lib/lms/repositories/book.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * PATCH /api/admin/books/[id]/metadata
 * Update book metadata (page number, language, etc.) - called by PDF processor
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const bookId = params.id
    const body = await request.json()

    // Get optional fields
    const { pageNumber, language } = body

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

    // Build update data with only provided fields
    const updateData: { pageNumber?: number | null; language?: string | null } = {}
    if (pageNumber !== undefined) {
      updateData.pageNumber = pageNumber
    }
    if (language !== undefined) {
      updateData.language = language
    }

    // Update metadata
    await updateBookMetadata(bookId, updateData)

    return NextResponse.json({
      success: true,
      message: 'Book metadata updated successfully',
    })
  } catch (error) {
    console.error('Error updating book metadata:', error)
    return NextResponse.json(
      { error: 'Failed to update book metadata' },
      { status: 500 }
    )
  }
}
