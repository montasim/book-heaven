import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/books/extract-all
 * Trigger content extraction for all books that don't have extracted content
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Bulk Extraction] Starting bulk content extraction...');

    // Get all ebooks/audiobooks with fileUrl but no extracted content
    const books = await prisma.book.findMany({
      where: {
        type: { in: ['EBOOK', 'AUDIO'] },
        fileUrl: { not: null },
        extractedContent: null
      },
      select: {
        id: true,
        name: true,
        type: true
      }
    });

    console.log(`[Bulk Extraction] Found ${books.length} books without extracted content`);

    if (books.length === 0) {
      return NextResponse.json({
        message: 'All books already have extracted content',
        count: 0
      });
    }

    // Trigger extraction for each (fire and forget, don't await)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000';

    let successCount = 0;
    let errorCount = 0;

    for (const book of books) {
      try {
        await fetch(`${baseUrl}/api/books/${book.id}/extract-content`, {
          method: 'POST',
        });
        successCount++;
        console.log(`[Bulk Extraction] Triggered extraction for book: ${book.name} (${book.id})`);
      } catch (error) {
        errorCount++;
        console.error(`[Bulk Extraction] Failed to trigger extraction for ${book.id}:`, error);
      }
    }

    return NextResponse.json({
      message: `Triggered extraction for ${successCount} books`,
      totalBooks: books.length,
      successCount,
      errorCount,
      books: books.map(b => ({ id: b.id, name: b.name, type: b.type }))
    });

  } catch (error: any) {
    console.error('[Bulk Extraction] Error:', error);
    console.error('[Bulk Extraction] Stack:', error.stack);

    return NextResponse.json(
      {
        error: error.message || 'Bulk extraction failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/books/extract-all
 * Get status of content extraction across all books
 */
export async function GET(request: NextRequest) {
  try {
    // Get statistics
    const [totalBooks, booksWithContent, booksWithoutContent, extractingBooks] = await Promise.all([
      prisma.book.count({
        where: {
          type: { in: ['EBOOK', 'AUDIO'] },
          fileUrl: { not: null }
        }
      }),
      prisma.book.count({
        where: {
          type: { in: ['EBOOK', 'AUDIO'] },
          fileUrl: { not: null },
          extractedContent: { not: null }
        }
      }),
      prisma.book.count({
        where: {
          type: { in: ['EBOOK', 'AUDIO'] },
          fileUrl: { not: null },
          extractedContent: null
        }
      }),
      prisma.book.count({
        where: {
          type: { in: ['EBOOK', 'AUDIO'] },
          fileUrl: { not: null },
          extractionStatus: 'pending'
        }
      })
    ]);

    // Calculate percentage
    const completionPercentage = totalBooks > 0
      ? Math.round((booksWithContent / totalBooks) * 100)
      : 0;

    return NextResponse.json({
      total: totalBooks,
      withContent: booksWithContent,
      withoutContent: booksWithoutContent,
      pendingExtraction: extractingBooks,
      completionPercentage,
      status: 'calculated'
    });

  } catch (error: any) {
    console.error('[Bulk Extraction] GET Error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to get extraction status' },
      { status: 500 }
    );
  }
}
