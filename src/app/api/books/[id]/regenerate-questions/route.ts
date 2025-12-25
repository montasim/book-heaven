import { NextRequest, NextResponse } from 'next/server';
import { getBookWithExtractedContent, updateQuestionsStatus } from '@/lib/lms/repositories/book.repository';
import { createBookQuestions } from '@/lib/lms/repositories/book-question.repository';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/books/[id]/regenerate-questions
 * Regenerate suggested questions for a book
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    console.log('[Regenerate Questions API] Starting regeneration for book:', id);

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
    await updateQuestionsStatus(id, {
      questionsStatus: 'pending',
    });

    // Generate questions in background (async, don't wait)
    generateQuestionsInBackground(id, fullBook, book.extractedContent);

    return NextResponse.json({
      message: 'Questions regeneration started',
      status: 'pending'
    });
  } catch (error: any) {
    console.error('[Regenerate Questions API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to regenerate questions' },
      { status: 500 }
    );
  }
}

/**
 * Generate questions in background
 */
async function generateQuestionsInBackground(bookId: string, book: any, content: string) {
  try {
    const { generateBookQuestions } = await import('@/lib/ai/question-generator');

    const authorNames = book.authors?.map((a: any) => a.author?.name || a.name) || [];
    const categoryNames = book.categories?.map((c: any) => c.category?.name || c.name) || [];

    console.log('[Regenerate Questions API] Generating questions for book:', bookId);

    const { questions } = await generateBookQuestions({
      bookName: book.name,
      authors: authorNames,
      categories: categoryNames,
      bookContent: content,
      questionCount: 20,
    });

    await createBookQuestions(bookId, questions);
    await updateQuestionsStatus(bookId, {
      questionsStatus: 'completed',
      questionsGeneratedAt: new Date(),
    });

    console.log('[Regenerate Questions API] Questions regenerated successfully');
  } catch (error) {
    console.error('[Regenerate Questions API] Background generation failed:', error);
    await updateQuestionsStatus(bookId, {
      questionsStatus: 'failed',
    });
  }
}
