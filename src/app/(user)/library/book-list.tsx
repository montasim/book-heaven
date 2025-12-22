'use client'

import { BookCard } from './book-card'
import { Book } from '@/app/dashboard/books/data/schema'

export function BookList({
  books,
  openDrawer,
  onEdit
}: {
  books: Book[]
  openDrawer?: () => void
  onEdit?: (book: Book) => void
}) {
  return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
              <BookCard key={book.id} book={book} onEdit={onEdit} />
          ))}
      </div>
  )
}
