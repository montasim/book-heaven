/**
 * PDF Processor Notification Helper
 *
 * Notifies the socket server to trigger PDF processing for books.
 * The PDF processor service downloads the PDF from Google Drive,
 * extracts content, generates summary/questions, and creates embeddings.
 */

import { config } from '@/config'

interface NotifyPdfProcessorParams {
  bookId: string
  pdfUrl: string
  directPdfUrl: string | null
  bookName: string
  authorNames: string[]
}

/**
 * Notify the socket server to trigger PDF processing for a book.
 * This is a non-blocking fire-and-forget operation.
 *
 * @param params - Book information needed for processing
 * @returns Promise that resolves when notification is sent
 */
export async function notifyPdfProcessor(params: NotifyPdfProcessorParams): Promise<void> {
  const { bookId, pdfUrl, directPdfUrl, bookName, authorNames } = params

  try {
    const socketServerUrl = config.socketServer.url
    const webhookApiKey = config.socketServer.webhookApiKey

    if (!webhookApiKey) {
      console.warn('[PDF Processor] WEBHOOK_API_KEY not configured, skipping notification')
      return
    }

    console.log('[PDF Processor] Notifying socket server for PDF processing:', {
      bookId,
      bookName,
    })

    const response = await fetch(`${socketServerUrl}/api/trigger-pdf-process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookApiKey}`,
      },
      body: JSON.stringify({
        bookId,
        pdfUrl,
        directPdfUrl,
        bookName,
        authorNames,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[PDF Processor] Failed to notify socket server:', {
        status: response.status,
        error: errorText,
      })
      throw new Error(`Failed to notify PDF processor: ${response.status}`)
    }

    const result = await response.json()
    console.log('[PDF Processor] Successfully notified socket server:', result)

  } catch (error) {
    // Log error but don't throw - the book is already created,
    // just the async processing might need manual retry later
    console.error('[PDF Processor] Error notifying socket server:', error)
  }
}
