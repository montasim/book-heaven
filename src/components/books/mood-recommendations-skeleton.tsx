'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function MoodRecommendationsSkeleton() {
  return (
    <div className="mt-4 md:mt-0 lg:mt-0 mb-6">
      <Card>
        <CardHeader className="py-3 sm:py-6 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-56" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}

export function MoodRecommendationsExpandedSkeleton() {
  return (
    <div className="mt-4 md:mt-0 lg:mt-0 mb-6">
      <Card>
        <CardHeader className="py-3 sm:py-6 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-56" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Mood Selector Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
