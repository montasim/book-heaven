import { NextRequest, NextResponse } from 'next/server';
import { updateBookQuestion, deleteBookQuestion } from '@/lib/lms/repositories/book-question.repository';

interface RouteContext {
  params: Promise<{ id: string; questionId: string }>;
}

/**
 * PUT /api/books/[id]/suggested-questions/[questionId]
 * Update a question
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { questionId } = await params;
    const body = await request.json();
    const { question, answer, order } = body;

    const updated = await updateBookQuestion(questionId, {
      question,
      answer,
      order,
    });

    return NextResponse.json({
      question: updated,
      message: 'Question updated successfully',
    });
  } catch (error: any) {
    console.error('[Update Question API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update question' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/books/[id]/suggested-questions/[questionId]
 * Delete a question
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { questionId } = await params;

    await deleteBookQuestion(questionId);

    return NextResponse.json({
      message: 'Question deleted successfully',
    });
  } catch (error: any) {
    console.error('[Delete Question API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete question' },
      { status: 500 }
    );
  }
}
