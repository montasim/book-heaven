'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Clock, CheckCircle, Edit, Trash2 } from 'lucide-react'
import { useLibraryContext } from './context/library-context'
import { getProxiedImageUrl } from '@/lib/image-proxy'

interface BookCardProps {
  book: any
  onEdit?: (book: any) => void
  onDelete?: (book: any) => void
}

// Calculate estimated reading time based on page count (average reading speed: ~2 minutes per page)
function calculateReadingTime(pageCount?: number | null): string | null {
  if (!pageCount || pageCount <= 0) return null
  const minutesPerPage = 2
  const totalMinutes = pageCount * minutesPerPage

  if (totalMinutes < 60) {
    return `${totalMinutes} min read`
  }
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m read`
    : `${hours}h read`
}

export function BookCard({ book, onEdit, onDelete }: BookCardProps) {
  const { setOpen, setCurrentRow } = useLibraryContext()
  const progress = Math.round(book.readingProgress?.[0]?.progress || 0)
  const currentPage = book.readingProgress?.[0]?.currentPage || 0
  const totalPages = book.pageNumber || '?'
  const authors = book.authors?.map((a: any) => a.name).join(', ') || 'Unknown'
  const estimatedReadingTime = calculateReadingTime(book.pageNumber)

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onEdit) {
      onEdit(book)
    } else {
      setCurrentRow(book)
      setOpen('edit')
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDelete) {
      onDelete(book)
    } else {
      setCurrentRow(book)
      setOpen('delete')
    }
  }

  return (
    <Link href={`/user-reader/${book.id}`} className="block">
      <Card className="group transition-all hover:shadow-lg cursor-pointer">
        <CardContent className="p-4">
          {/* Mobile: Horizontal layout */}
          <div className="flex gap-4 md:hidden">
            {/* Book Cover - smaller, on the left */}
            <div className="w-20 h-28 sm:w-24 sm:h-32 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0">
              {book.image ? (
                <img
                  src={getProxiedImageUrl(book.image) || book.image}
                  alt={book.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* Book Info - on the right */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-2 text-sm">{book.name}</h3>
                  {/* Action Buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-background/50 hover:bg-background/80"
                      onClick={handleEdit}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-background/50 hover:bg-background/80 text-destructive hover:text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground truncate">by {authors}</p>
              </div>

              {/* Progress Section */}
              {progress > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Progress</span>
                    <span className="text-xs font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>Page {currentPage} of {totalPages}</span>
                    {estimatedReadingTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{estimatedReadingTime}</span>
                      </span>
                    )}
                  </div>
                </>
              ) : (
                /* No progress - show reading time */
                estimatedReadingTime && (
                  <div className="text-xs text-muted-foreground">
                    {estimatedReadingTime}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Desktop: Vertical layout */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Book Cover */}
              <div className="w-full h-48 bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {book.image ? (
                  <img src={getProxiedImageUrl(book.image) || book.image} alt={book.name} className="h-full w-full object-cover" />
                ) : (
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                )}
              </div>

              {/* Action Icons */}
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/50 hover:bg-background/80"
                  onClick={handleEdit}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/50 hover:bg-background/80 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Book Info */}
            <div className="space-y-2">
              <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                {book.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                by {authors}
              </p>

              {/* Progress */}
              {progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Page {currentPage} of {totalPages}</span>
                    {estimatedReadingTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{estimatedReadingTime}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-4">
                {progress === 0 ? (
                  <Button className="w-full" size="sm">
                    Start Reading
                  </Button>
                ) : progress >= 100 ? (
                  <Button variant="outline" className="w-full" size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Read Again
                  </Button>
                ) : (
                  <Button className="w-full" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Continue
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
