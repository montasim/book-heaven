/**
 * PDF Processing Jobs API Route
 *
 * Admin-only endpoints for managing PDF processing jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ProcessingStatus } from '@prisma/client'

// ============================================================================
// SCHEMAS
// ============================================================================

const PdfProcessingJobsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING', 'ALL']).default('ALL'),
  bookId: z.string().uuid().optional(),
})

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * GET /api/admin/pdf-processing
 *
 * Get PDF processing jobs with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await requireAuth()

    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validatedQuery = PdfProcessingJobsQuerySchema.parse(queryParams)

    const { page, limit, status, bookId } = validatedQuery

    // Build where clause
    const where: { status?: ProcessingStatus; bookId?: string } = {}

    if (status !== 'ALL') {
      where.status = status as ProcessingStatus
    }

    if (bookId) {
      where.bookId = bookId
    }

    const skip = (page - 1) * limit

    // Fetch jobs and total count in parallel
    const [jobs, total] = await Promise.all([
      prisma.pdfProcessingJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { createdAt: 'desc' },
          { nextAttemptAt: 'asc' },
        ],
      }),
      prisma.pdfProcessingJob.count({ where }),
    ])

    // Fetch book details for each job
    const books = await prisma.book.findMany({
      where: {
        id: { in: jobs.map(j => j.bookId) }
      },
      select: {
        id: true,
        name: true,
        type: true,
        image: true,
        directImageUrl: true,
      }
    })

    // Create a map for quick lookup
    const bookMap = new Map(books.map(b => [b.id, b]))

    // Transform jobs data
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      bookId: job.bookId,
      book: bookMap.get(job.bookId) || null,
      status: job.status,
      retryCount: job.retryCount,
      maxRetries: job.maxRetries,
      lastAttemptAt: job.lastAttemptAt,
      nextAttemptAt: job.nextAttemptAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      errorMessage: job.errorMessage,
      downloadStatus: job.downloadStatus,
      extractionStatus: job.extractionStatus,
      summaryStatus: job.summaryStatus,
      questionsStatus: job.questionsStatus,
      embeddingStatus: job.embeddingStatus,
      pdfUrl: job.pdfUrl,
      bookName: job.bookName,
      authorNames: job.authorNames,
      pagesExtracted: job.pagesExtracted,
      wordsExtracted: job.wordsExtracted,
      summaryLength: job.summaryLength,
      questionsGenerated: job.questionsGenerated,
      embeddingsCreated: job.embeddingsCreated,
      processingTime: job.processingTime,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        jobs: transformedJobs,
        pagination: {
          currentPage: page,
          totalPages,
          total,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    })

  } catch (error) {
    console.error('Get PDF processing jobs error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        message: error.errors[0]?.message
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch PDF processing jobs',
      message: 'An error occurred while fetching jobs'
    }, { status: 500 })
  }
}
