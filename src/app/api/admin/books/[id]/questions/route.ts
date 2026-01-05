import { NextRequest, NextResponse } from 'next/server'
import { createBookQuestions } from '@/lib/lms/repositories/book-question.repository'
import { getBookById } from '@/lib/lms/repositories/book.repository'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * PATCH /api/admin/books/[id]/questions
 * Update book AI-generated questions (called by PDF processor)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const bookId = params.id
    const body = await request.json()

    // Validate required fields
    const { questions } = body
    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Missing required field: questions (array)' },
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

    // Create questions (this deletes old AI-generated questions first)
    await createBookQuestions(bookId, questions)

    // Update questions status on the book
    await prisma.book.update({
      where: { id: bookId },
      data: {
        questionsStatus: 'COMPLETED',
        questionsGeneratedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Questions updated successfully',
      count: questions.length,
    })
  } catch (error) {
    console.error('Error updating questions:', error)
    return NextResponse.json(
      { error: 'Failed to update questions' },
      { status: 500 }
    )
  }
}
