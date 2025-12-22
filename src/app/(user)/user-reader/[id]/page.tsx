'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { PDFViewer } from '@/components/reader/pdf-viewer'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function UserReaderPage() {
  const params = useParams()
  const bookId = params.id as string
  const [book, setBook] = useState<{ fileUrl: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedBookIdRef = useRef<string | null>(null) // Track which book has been fetched

  useEffect(() => {
    const fetchBook = async () => {
      // Prevent fetching the same book twice (Strict Mode, remounts, etc.)
      if (bookId === fetchedBookIdRef.current) return
      fetchedBookIdRef.current = bookId

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/books/${bookId}`)
        if (!response.ok) {
          throw new Error('Book not found')
        }
        const data = await response.json()
        setBook(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load book')
      } finally {
        setIsLoading(false)
      }
    }

    if (bookId) {
      fetchBook()
    }
  }, [bookId])

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading book...</p>
        </div>
      </div>
    )
  }

  if (error || !book?.fileUrl) {
    return (
      <div className="h-[calc(100vh-5rem)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-destructive mb-2">Error</p>
            <p className="text-muted-foreground">{error || 'Book not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="-mx-4 h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
      <PDFViewer fileUrl={book.fileUrl} className="h-full" />
    </div>
  )
}
