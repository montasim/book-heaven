import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

interface BookGridSkeletonProps {
  count?: number
  variant?: 'default' | 'compact'
}

export function BookGridSkeleton({ count = 6, variant = 'default' }: BookGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            {/* Book Cover */}
            <Skeleton className="w-full h-40 mb-4 rounded-lg" />

            {/* Title */}
            <Skeleton className="h-5 w-3/4 mb-2" />

            {/* Author */}
            <Skeleton className="h-4 w-1/2 mb-3" />

            {/* Progress Bar Skeleton */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
