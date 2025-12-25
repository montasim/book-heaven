import { NextRequest, NextResponse } from 'next/server';
import { getBookWithExtractedContent } from '@/lib/lms/repositories/book.repository';
import { getBookQuestions, createBookQuestion } from '@/lib/lms/repositories/book-question.repository';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/books/[id]/suggested-questions
 * Fetch all suggested questions for a book
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    // Check if book exists
    const book = await getBookWithExtractedContent(id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Get questions
    const questions = await getBookQuestions(id);

    return NextResponse.json({
      questions,
      count: questions.length,
      hasExtractedContent: !!book.extractedContent,
      questionsStatus: book.questionsStatus,
    });
  } catch (error: any) {
    console.error('[Get Questions API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/books/[id]/suggested-questions
 * Add a custom (manual) question
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { question, answer, order } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const newQuestion = await createBookQuestion(id, {
      question,
      answer,
      order,
    });

    return NextResponse.json({
      question: newQuestion,
      message: 'Question added successfully',
    });
  } catch (error: any) {
    console.error('[Add Question API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add question' },
      { status: 500 }
    );
  }
}
