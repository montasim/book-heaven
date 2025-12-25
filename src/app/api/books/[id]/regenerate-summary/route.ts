import { NextRequest, NextResponse } from 'next/server';
import { getBookWithExtractedContent, updateBookAISummary } from '@/lib/lms/repositories/book.repository';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/books/[id]/regenerate-summary
 * Regenerate AI summary for a book
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    console.log('[Regenerate Summary API] Starting regeneration for book:', id);

    // Get book with extracted content
    const book = await getBookWithExtractedContent(id);

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (!book.extractedContent) {
      return NextResponse.json(
        { error: 'Book content has not been extracted yet' },
        { status: 400 }
      );
    }

    // Get full book details for context
    const fullBook = await prisma.book.findUnique({
      where: { id },
      include: {
        authors: {
          include: {
            author: true,
          }
        },
        categories: {
          include: {
            category: true,
          }
        },
      }
    });

    if (!fullBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Update status to pending
    await updateBookAISummary(id, {
      aiSummary: '',
      aiSummaryStatus: 'pending',
    });

    // Generate summary in background (async, don't wait)
    generateSummaryInBackground(id, fullBook, book.extractedContent);

    return NextResponse.json({
      message: 'Summary regeneration started',
      status: 'pending'
    });
  } catch (error: any) {
    console.error('[Regenerate Summary API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to regenerate summary' },
      { status: 500 }
    );
  }
}

/**
 * Generate summary in background
 */
async function generateSummaryInBackground(bookId: string, book: any, content: string) {
  try {
    const { generateBookSummary } = await import('@/lib/ai/summary-generator');

    const authorNames = book.authors?.map((a: any) => a.author?.name || a.name) || [];
    const categoryNames = book.categories?.map((c: any) => c.category?.name || c.name) || [];

    console.log('[Regenerate Summary API] Generating summary for book:', bookId);

    const { summary } = await generateBookSummary({
      bookName: book.name,
      authors: authorNames,
      categories: categoryNames,
      bookContent: content,
      targetWords: 200,
    });

    await updateBookAISummary(bookId, {
      aiSummary: summary,
      aiSummaryStatus: 'completed',
    });

    console.log('[Regenerate Summary API] Summary regenerated successfully');
  } catch (error) {
    console.error('[Regenerate Summary API] Background generation failed:', error);
    await updateBookAISummary(bookId, {
      aiSummary: '',
      aiSummaryStatus: 'failed',
    });
  }
}
