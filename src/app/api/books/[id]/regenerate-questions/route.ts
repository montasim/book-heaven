import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/books/[id]/regenerate-questions
 * Regenerate suggested questions for a book using the PDF Processor service
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    console.log('[Regenerate Questions API] Starting regeneration for book:', id);

    // Get book with authors for PDF processor
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        authors: {
          include: {
            author: true,
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (!book.fileUrl) {
      return NextResponse.json(
        { error: 'Book does not have a file associated with it' },
        { status: 400 }
      );
    }

    // Trigger regeneration via PDF processor
    const pdfProcessorUrl = config.pdfProcessor.url;
    const pdfProcessorApiKey = config.pdfProcessor.apiKey;

    if (!pdfProcessorUrl) {
      return NextResponse.json(
        { error: 'PDF Processor URL not configured' },
        { status: 500 }
      );
    }

    // Get author names
    const authorNames = book.authors.map((a) => a.author.name).filter(Boolean);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (pdfProcessorApiKey) {
      headers['Authorization'] = `Bearer ${pdfProcessorApiKey}`;
    }

    // First, check if job exists
    const jobCheckUrl = `${pdfProcessorUrl}/api/job/${id}`;
    console.log('[Regenerate Questions API] Checking if job exists:', jobCheckUrl);

    const jobCheckResponse = await fetch(jobCheckUrl, { headers });
    let result;

    if (jobCheckResponse.ok) {
      // Job exists, trigger selective questions regeneration
      console.log('[Regenerate Questions API] Job exists, triggering questions regeneration');
      const regenerateUrl = `${pdfProcessorUrl}/api/job/${id}/regenerate-questions`;

      const regenerateResponse = await fetch(regenerateUrl, {
        method: 'POST',
        headers,
      });

      if (!regenerateResponse.ok) {
        const errorText = await regenerateResponse.text();
        console.error('[Regenerate Questions API] PDF processor regenerate error:', errorText);
        return NextResponse.json(
          { error: 'Failed to trigger regeneration', details: errorText },
          { status: regenerateResponse.status }
        );
      }

      result = await regenerateResponse.json();
    } else {
      // Job doesn't exist, create new job
      console.log('[Regenerate Questions API] Job does not exist, creating new job');
      const processUrl = `${pdfProcessorUrl}/api/process-pdf`;

      const processResponse = await fetch(processUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bookId: book.id,
          pdfUrl: book.fileUrl,
          directPdfUrl: book.directFileUrl,
          bookName: book.name,
          authorNames,
        }),
      });

      if (!processResponse.ok) {
        const errorText = await processResponse.text();
        console.error('[Regenerate Questions API] PDF processor process error:', errorText);
        return NextResponse.json(
          { error: 'Failed to create processing job', details: errorText },
          { status: processResponse.status }
        );
      }

      result = await processResponse.json();
    }

    console.log('[Regenerate Questions API] PDF processor response:', result);

    return NextResponse.json({
      message: 'Questions regeneration triggered successfully',
      status: 'pending',
      pdfProcessorResponse: result,
    });
  } catch (error: any) {
    console.error('[Regenerate Questions API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to regenerate questions' },
      { status: 500 }
    );
  }
}
