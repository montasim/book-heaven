'use client'

import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Book } from '@/hooks/use-book'
import { cn } from '@/lib/utils'

interface BookChatButtonProps {
  book: Book
  onClick: () => void
  className?: string
}

/**
 * Chat button component for books
 * Only displays for ebooks/audiobooks with user access
 */
export function BookChatButton({ book, onClick, className }: BookChatButtonProps) {
  const { user } = useAuth()

  // Only show for ebooks/audiobooks and authenticated users with access
  const shouldShow = user &&
    (book.type === 'EBOOK' || book.type === 'AUDIO') &&
    book.fileUrl &&
    book.canAccess

  if (!shouldShow) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="default"
      onClick={onClick}
      className={cn("gap-2", className)}
    >
      <MessageSquare className="h-4 w-4" />
      Chat with AI
    </Button>
  )
}
