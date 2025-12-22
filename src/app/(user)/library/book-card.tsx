'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Clock, CheckCircle, Edit, Trash2 } from 'lucide-react'
import { useLibraryContext } from './context/library-context'

interface BookCardProps {
  book: any
  onEdit?: (book: any) => void
  onDelete?: (book: any) => void
}

export function BookCard({ book, onEdit, onDelete }: BookCardProps) {
  const { setOpen, setCurrentRow } = useLibraryContext()
  const progress = book.readingProgress?.[0]?.progress || 0
  const currentPage = book.readingProgress?.[0]?.currentPage || 0
  const readingTime = book.readingProgress?.[0]?.readingTime || 0

  const handleEdit = () => {
    if (onEdit) {
      onEdit(book)
    } else {
      setCurrentRow(book)
      setOpen('edit')
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(book)
    } else {
      setCurrentRow(book)
      setOpen('delete')
    }
  }

  return (
    <Card className="group transition-all hover:shadow-lg">
      <CardContent className="p-4">
        <div className="relative">
          {/* Book Cover */}
          <div className="w-full h-48 bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
            {book.image ? (
              <img src={book.image} alt={book.name} className="h-full w-full object-cover" />
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
          <Link href={`/user-reader/${book.id}`} className="cursor-pointer">
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {book.name}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground">
            by {book.authors.map((a: any) => a.name).join(', ')}
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
                <span>Page {currentPage}</span>
                {readingTime > 0 && <span>{readingTime}h read</span>}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4">
            {progress === 0 ? (
              <Link href={`/user-reader/${book.id}`}>
                <Button className="w-full" size="sm">
                  Start Reading
                </Button>
              </Link>
            ) : progress === 100 ? (
              <Link href={`/user-reader/${book.id}`}>
                <Button variant="outline" className="w-full" size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Read Again
                </Button>
              </Link>
            ) : (
              <Link href={`/user-reader/${book.id}`}>
                <Button className="w-full" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
