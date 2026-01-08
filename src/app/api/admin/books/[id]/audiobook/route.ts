import { NextRequest, NextResponse } from 'next/server'
import { updateBookAudiobook, getBookById } from '@/lib/lms/repositories/book.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * PATCH /api/admin/books/[id]/audiobook
 * Update book audiobook (called by PDF processor)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const bookId = params.id
    const body = await request.json()

    // Validate required fields
    const { audiobookUrl, audiobookDirectUrl, audiobookDriveFileId, audiobookDuration } = body
    if (!audiobookUrl || !audiobookDirectUrl || !audiobookDriveFileId) {
      return NextResponse.json(
        { error: 'Missing required fields: audiobookUrl, audiobookDirectUrl, audiobookDriveFileId' },
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

    // Update audiobook
    await updateBookAudiobook(bookId, {
      audiobookUrl,
      audiobookDirectUrl,
      audiobookDriveFileId,
      audiobookDuration,
      audiobookStatus: 'completed',
      audiobookGeneratedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: 'Audiobook updated successfully',
    })
  } catch (error) {
    console.error('Error updating audiobook:', error)
    return NextResponse.json(
      { error: 'Failed to update audiobook' },
      { status: 500 }
    )
  }
}
