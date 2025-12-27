'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { RecommendationReasons } from './recommendation-badge'
import { BookTypeBadge } from './book-type-badge'
import type { Book, RecommendationReason } from '@/hooks/use-book'

interface BookSuggestionsProps {
  books: Book[]
  recommendationReasons: Record<string, RecommendationReason>
  currentBookId: string
  className?: string
}

export function BookSuggestions({
  books,
  recommendationReasons,
  currentBookId,
  className
}: BookSuggestionsProps) {
  // Group books by primary recommendation reason
  const groupedBooks = books.reduce((acc, book) => {
    const reason = recommendationReasons[book.id]
    if (!reason) return acc

    // Determine primary reason (priority: author > publication > category)
    let primaryReason: string | null = null
    if (reason.authors && reason.authors.length > 0) {
      primaryReason = 'author'
    } else if (reason.publications && reason.publications.length > 0) {
      primaryReason = 'publication'
    } else if (reason.categories && reason.categories.length > 0) {
      primaryReason = 'category'
    }

    if (!primaryReason) return acc

    if (!acc[primaryReason]) {
      acc[primaryReason] = []
    }
    acc[primaryReason].push(book)
    return acc
  }, {} as Record<string, Book[]>)

  const hasSuggestions = Object.keys(groupedBooks).length > 0

  if (!hasSuggestions) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No suggestions available</h3>
        <p className="text-muted-foreground">
          We couldn&apos;t find any similar books at this time.
        </p>
      </div>
    )
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'author':
        return 'More by Author'
      case 'publication':
        return 'From the Same Publisher'
      case 'category':
        return 'Similar Books'
      default:
        return 'You might also like'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Author Suggestions */}
      {groupedBooks.author && groupedBooks.author.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{getReasonLabel('author')}</h3>
            {groupedBooks.author.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {groupedBooks.author.length} book{groupedBooks.author.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {groupedBooks.author.map((book) => (
              <SuggestionCard
                key={book.id}
                book={book}
                reason={recommendationReasons[book.id]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Publication Suggestions */}
      {groupedBooks.publication && groupedBooks.publication.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{getReasonLabel('publication')}</h3>
            <span className="text-sm text-muted-foreground">
              {groupedBooks.publication.length} book{groupedBooks.publication.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {groupedBooks.publication.map((book) => (
              <SuggestionCard
                key={book.id}
                book={book}
                reason={recommendationReasons[book.id]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category Suggestions */}
      {groupedBooks.category && groupedBooks.category.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{getReasonLabel('category')}</h3>
            <span className="text-sm text-muted-foreground">
              {groupedBooks.category.length} book{groupedBooks.category.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {groupedBooks.category.map((book) => (
              <SuggestionCard
                key={book.id}
                book={book}
                reason={recommendationReasons[book.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface SuggestionCardProps {
  book: Book
  reason: RecommendationReason
}

function SuggestionCard({ book, reason }: SuggestionCardProps) {
  return (
    <Link href={`/books/${book.id}`}>
      <Card className="group transition-all hover:shadow-lg cursor-pointer h-full">
        <CardContent className="p-3 space-y-2">
          {/* Book Cover */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
            {book.image ? (
              <Image
                src={getProxiedImageUrl(book.image) || book.image}
                alt={book.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                unoptimized
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <BookOpen className="h-8 w-8" />
              </div>
            )}

            {/* Type Badge */}
            {book.type && (
              <div className="absolute top-1 left-1">
                <BookTypeBadge type={book.type} size="sm" />
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="space-y-1">
            {/* Title */}
            <h4 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {book.name}
            </h4>

            {/* Authors */}
            {book.authors && book.authors.length > 0 && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {book.authors.map(a => a.name).join(', ')}
              </p>
            )}
          </div>

          {/* Recommendation Reason */}
          <RecommendationReasons reasons={reason} className="mt-2" />
        </CardContent>
      </Card>
    </Link>
  )
}
