'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface BookCardSkeletonProps {
  viewMode?: 'grid' | 'list'
  className?: string
  coverHeight?: 'default' | 'tall'
}

export function BookCardSkeleton({ viewMode = 'grid', className, coverHeight = 'default' }: BookCardSkeletonProps) {
  const coverHeightClass = coverHeight === 'tall' ? 'h-64' : 'h-48'

  // Compact variant (list view)
  if (viewMode === 'list') {
    return (
      <Card className={cn('transition-all duration-200', className)}>
        <CardContent className="p-3">
          <div>
            {/* Badges - Top right */}
            <div className="flex justify-end gap-1 mb-2">
              <Skeleton className="h-4 w-12 bg-muted" />
            </div>

            <div className="flex gap-3">
              {/* Book Cover */}
              <div className="flex-shrink-0">
                <div className="relative w-36 h-52 overflow-hidden rounded bg-muted">
                  <Skeleton className="w-full h-full bg-muted" />
                  {/* Add to Bookshelf placeholder */}
                  <Skeleton className="absolute top-1 right-1 h-6 w-6 bg-muted/50" />
                </div>

                {/* Reader count */}
                <Skeleton className="h-3 w-8 mt-1.5 bg-muted" />
              </div>

              {/* Book Info */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex-1">
                  {/* Title */}
                  <Skeleton className="h-4 w-full mb-1 bg-muted" />

                  {/* Author */}
                  <Skeleton className="h-3.5 w-2/3 mb-1.5 bg-muted" />

                  {/* Uploader */}
                  <div className="flex items-center gap-1 mb-2">
                    <Skeleton className="h-4 w-4 rounded-full bg-muted" />
                    <Skeleton className="h-3.5 w-20 bg-muted" />
                  </div>

                  {/* Categories */}
                  <div className="flex items-center gap-1 mb-2">
                    <Skeleton className="h-5 w-12 bg-muted" />
                    <Skeleton className="h-5 w-16 bg-muted" />
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1.5 mb-1.5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-16 bg-muted" />
                    <Skeleton className="h-3 w-8 bg-muted" />
                  </div>
                  <Skeleton className="h-1 w-full bg-muted" />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 flex-1 bg-muted" />
                  <Skeleton className="h-6 flex-1 bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view (responsive - horizontal on mobile, vertical on desktop)
  return (
    <Card className={cn('transition-all hover:shadow-lg', className)}>
      <CardContent className="p-4">
        {/* Unified vertical layout for both mobile and desktop */}
        {/* Book Cover */}
        <div className="relative w-full bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          <Skeleton className={cn("w-full bg-muted", coverHeightClass)} />
        </div>

        {/* Book Info */}
        <div className="space-y-3">
          {/* Title */}
          <Skeleton className="h-5 w-full bg-muted" />

          {/* Author */}
          <Skeleton className="h-4 w-3/4 bg-muted" />

          {/* Uploader */}
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-5 w-5 rounded-full bg-muted" />
            <Skeleton className="h-3.5 w-24 bg-muted" />
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-16 bg-muted" />
              <Skeleton className="h-3.5 w-8 bg-muted" />
            </div>
            <Skeleton className="h-2 w-full bg-muted" />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1">
            <Skeleton className="h-6 w-16 bg-muted" />
            <Skeleton className="h-6 w-20 bg-muted" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <Skeleton className="h-9 flex-1 bg-muted" />
            <Skeleton className="h-9 flex-1 bg-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
