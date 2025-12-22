import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Import prisma dynamically to avoid edge runtime issues
    const { prisma } = await import('@/lib/prisma')

    const book = await prisma.book.findFirst({
      where: {
        id,
        OR: [
          { entryById: session.userId },
          { isPublic: true }
        ]
      },
      select: {
        fileUrl: true,
        name: true
      }
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error('Error fetching book:', error)
    return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 })
  }
}
