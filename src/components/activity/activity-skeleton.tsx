'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ActivityPageHeaderSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-56 mb-2" />
      <Skeleton className="h-4 w-72" />
    </div>
  )
}

export function ActivityFilterCardSkeleton() {
  return (
    <Card className='p-4'>
      <div className='flex items-center gap-2 mb-4'>
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-5 w-32" />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className='space-y-2'>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </Card>
  )
}

export function ActivityTimelineItemSkeleton() {
  return (
    <Card className='p-4'>
      <div className='flex items-start gap-4'>
        {/* Icon */}
        <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />

        {/* Content */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between gap-4 mb-2'>
            <div className='flex-1 space-y-2'>
              <div className='flex items-center gap-2'>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>

            {/* Status and Time */}
            <div className='flex items-center gap-2'>
              <Skeleton className="h-3 w-16" />
            </div>
          </div>

          {/* Resource Type Badge */}
          <div className='flex items-center gap-2'>
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </div>
    </Card>
  )
}

export function ActivityTimelineGroupSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className='space-y-3'>
      {/* Date Header */}
      <div className='flex items-center gap-4 mb-4'>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="flex-1 h-px bg-border" />
      </div>

      {/* Activity Items */}
      {[...Array(count)].map((_, i) => (
        <ActivityTimelineItemSkeleton key={i} />
      ))}
    </div>
  )
}

export function ActivityPageSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <ActivityPageHeaderSkeleton />

      {/* Stats Cards - 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-5" />
              </div>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <ActivityFilterCardSkeleton />

      {/* Timeline Groups */}
      <ActivityTimelineGroupSkeleton count={3} />
      <ActivityTimelineGroupSkeleton count={2} />
    </div>
  )
}
