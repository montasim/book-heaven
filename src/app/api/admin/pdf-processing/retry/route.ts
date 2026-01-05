/**
 * PDF Processing Job Retry API Route
 *
 * Admin-only endpoint to manually retry failed PDF processing jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { config } from '@/config'
import { ProcessingStatus } from '@prisma/client'

// ============================================================================
// SCHEMAS
// ============================================================================

const RetryJobSchema = z.object({
  jobId: z.string().uuid(),
})

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * POST /api/admin/pdf-processing/retry
 *
 * Manually retry a failed PDF processing job
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { jobId } = RetryJobSchema.parse(body)

    // Fetch the job
    const job = await prisma.pdfProcessingJob.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Not found',
        message: 'PDF processing job not found'
      }, { status: 404 })
    }

    // Check if job can be retried (only failed or completed jobs can be retried)
    if (job.status !== ProcessingStatus.FAILED && job.status !== ProcessingStatus.COMPLETED) {
      return NextResponse.json({
        success: false,
        error: 'Invalid state',
        message: `Cannot retry job with status: ${job.status}`
      }, { status: 400 })
    }

    // Check retry limit
    if (job.retryCount >= job.maxRetries) {
      return NextResponse.json({
        success: false,
        error: 'Retry limit exceeded',
        message: `Job has already been retried ${job.retryCount} times (max: ${job.maxRetries})`
      }, { status: 400 })
    }

    // Update job status
    const updatedJob = await prisma.pdfProcessingJob.update({
      where: { id: jobId },
      data: {
        status: ProcessingStatus.PENDING,
        retryCount: job.retryCount + 1,
        nextAttemptAt: new Date(),
        lastAttemptAt: null,
        completedAt: null,
        failedAt: null,
        errorMessage: null,
        // Reset step statuses
        downloadStatus: 'PENDING',
        extractionStatus: 'PENDING',
        summaryStatus: 'PENDING',
        questionsStatus: 'PENDING',
        embeddingStatus: 'PENDING',
        // Reset stats
        pagesExtracted: null,
        wordsExtracted: null,
        summaryLength: null,
        questionsGenerated: null,
        embeddingsCreated: null,
        processingTime: null,
      },
    })

    // Notify socket server to trigger PDF processing
    const socketServerUrl = config.socketServer.url
    const webhookApiKey = config.socketServer.webhookApiKey

    if (!webhookApiKey) {
      console.error('[PDF Processing Retry] WEBHOOK_API_KEY not configured')
      return NextResponse.json({
        success: false,
        error: 'Configuration error',
        message: 'WEBHOOK_API_KEY not configured'
      }, { status: 500 })
    }

    try {
      const response = await fetch(`${socketServerUrl}/api/trigger-pdf-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${webhookApiKey}`,
        },
        body: JSON.stringify({
          bookId: job.bookId,
          pdfUrl: job.pdfUrl,
          directPdfUrl: job.directPdfUrl,
          bookName: job.bookName,
          authorNames: job.authorNames,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[PDF Processing Retry] Failed to notify socket server:', {
          status: response.status,
          error: errorText,
        })

        // Revert job status to failed
        await prisma.pdfProcessingJob.update({
          where: { id: jobId },
          data: {
            status: ProcessingStatus.FAILED,
            errorMessage: `Failed to notify socket server: ${response.status}`,
          },
        })

        return NextResponse.json({
          success: false,
          error: 'Failed to notify socket server',
          message: `Could not trigger PDF processing: ${response.status}`
        }, { status: 502 })
      }

      const result = await response.json()
      console.log('[PDF Processing Retry] Successfully notified socket server:', result)

    } catch (fetchError) {
      console.error('[PDF Processing Retry] Error notifying socket server:', fetchError)

      // Revert job status to failed
      await prisma.pdfProcessingJob.update({
        where: { id: jobId },
        data: {
          status: ProcessingStatus.FAILED,
          errorMessage: `Failed to notify socket server: ${fetchError}`,
        },
      })

      return NextResponse.json({
        success: false,
        error: 'Socket server error',
        message: 'Could not reach socket server'
      }, { status: 503 })
    }

    return NextResponse.json({
      success: true,
      data: {
        job: updatedJob,
      },
      message: 'PDF processing job queued for retry'
    })

  } catch (error) {
    console.error('Retry PDF processing job error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        message: error.errors[0]?.message
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to retry PDF processing job',
      message: 'An error occurred while retrying the job'
    }, { status: 500 })
  }
}
