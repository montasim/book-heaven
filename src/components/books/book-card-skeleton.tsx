'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface BookCardSkeletonProps {
  viewMode?: 'grid' | 'list'
  className?: string
}

export function BookCardSkeleton({ viewMode = 'grid', className }: BookCardSkeletonProps) {
  // List/Compact view skeleton
  if (viewMode === 'list') {
    return (
      <Card className={cn('transition-all duration-200', className)}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Book Cover - Compact */}
            <div className="flex-shrink-0">
              <Skeleton className="w-16 h-20 rounded bg-muted" />
            </div>

            {/* Book Info - Compact */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Title */}
              <Skeleton className="h-5 w-3/4 bg-muted" />

              {/* Author */}
              <Skeleton className="h-4 w-1/2 bg-muted" />

              {/* Metadata */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-16 bg-muted" />
              </div>

              {/* Progress */}
              <div className="space-y-1">
                <Skeleton className="h-3 w-20 bg-muted" />
                <Skeleton className="h-1.5 w-full bg-muted" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view skeleton (responsive - horizontal on mobile, vertical on desktop)
  return (
    <Card className={cn('transition-all hover:shadow-lg', className)}>
      <CardContent className="p-4">
        {/* Mobile: Horizontal layout */}
        <div className="flex gap-4 md:hidden">
          {/* Book Cover - Mobile */}
          <div className="flex-shrink-0">
            <Skeleton className="w-20 h-28 rounded-t bg-muted" />
          </div>

          {/* Metadata - Mobile */}
          <div className="w-20 space-y-1.5">
            <Skeleton className="h-4 w-4 rounded-full bg-muted" />
            <Skeleton className="h-3 w-12 bg-muted" />
          </div>

          {/* Book Info - Mobile */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-3 w-2/3 bg-muted" />
            </div>

            {/* Progress - Mobile */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-16 bg-muted" />
              <Skeleton className="h-2 w-full bg-muted" />
            </div>
          </div>
        </div>

        {/* Desktop: Vertical layout */}
        <div className="hidden md:block">
          {/* Book Cover - Desktop */}
          <div className="relative w-full bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
            <Skeleton className="w-full h-64 bg-muted" />
          </div>

          {/* Book Info - Desktop */}
          <div className="space-y-3">
            {/* Title */}
            <Skeleton className="h-6 w-full bg-muted" />

            {/* Author */}
            <Skeleton className="h-4 w-3/4 bg-muted" />

            {/* Metadata */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-20 bg-muted" />
            </div>

            {/* Progress - Desktop */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16 bg-muted" />
                <Skeleton className="h-4 w-8 bg-muted" />
              </div>
              <Skeleton className="h-2 w-full bg-muted" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
