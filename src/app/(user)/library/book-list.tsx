'use client'

import { BookGrid } from '@/components/books/book-grid'
import { Book } from '@/app/dashboard/books/data/schema'
import type { Book as PublicBook } from '@/hooks/use-book'

// Transform dashboard Book to public Book with canAccess property
const toPublicBook = (book: Book): PublicBook => ({
  ...book,
  canAccess: true, // User has access to their own library books
  requiresPremium: book.requiresPremium ?? false,
  readingProgress: book.readingProgress?.[0] ?? null, // Take first progress entry
  publications: book.publications ?? undefined,
  entryBy: book.entryBy ?? undefined,
  entryDate: book.entryDate ?? undefined,
})

export function BookList({
  books,
  onEditAction,
  onCardClickAction
}: {
  books: Book[]
  onEditAction?: (book: Book) => void
  onCardClickAction?: (book: Book) => void
}) {
  const publicBooks = books.map(toPublicBook)

  // Create a map to find original book by id
  const bookMap = new Map(books.map(b => [b.id, b]))

  // Wrap callbacks to convert back to dashboard Book type
  const handleEdit = onEditAction
    ? (publicBook: PublicBook) => {
        const originalBook = bookMap.get(publicBook.id)
        if (originalBook) onEditAction(originalBook)
      }
    : undefined

  const handleCardClick = onCardClickAction
    ? (publicBook: PublicBook) => {
        const originalBook = bookMap.get(publicBook.id)
        if (originalBook) onCardClickAction(originalBook)
      }
    : undefined

  return (
    <BookGrid
      books={publicBooks}
      onEdit={handleEdit}
      onClick={handleCardClick}
      showEditActions={true}
      showProgressActions={true}
      showTypeBadge={true}
      coverHeight="default"
    />
  )
}
