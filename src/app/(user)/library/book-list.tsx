'use client'

import { BookGrid } from '@/components/books/book-grid'
import { Book } from '@/app/dashboard/books/data/schema'

export function BookList({
  books,
  openDrawer,
  onEdit,
  onCardClick
}: {
  books: Book[]
  openDrawer?: () => void
  onEdit?: (book: Book) => void
  onCardClick?: (book: Book) => void
}) {
  return (
    <BookGrid
      books={books}
      onEdit={onEdit}
      onClick={onCardClick}
      showEditActions={true}
      showProgressActions={true}
      showTypeBadge={true}
      coverHeight="default"
    />
  )
}
