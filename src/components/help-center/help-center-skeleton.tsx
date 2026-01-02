'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function HelpCenterPageHeaderSkeleton() {
  return (
    <div className='flex-none mb-2'>
      <div className='flex items-center gap-2'>
        <Skeleton className='h-6 w-6' />
        <Skeleton className='h-8 w-40' />
      </div>
      <Skeleton className='h-4 w-80 mt-2' />
    </div>
  )
}

export function HelpCenterTabsListSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:justify-between gap-4 mt-4">
      {/* Tabs List Skeleton */}
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className='h-10 w-24' />
        ))}
      </div>

      {/* Filter Toolbar Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className='h-10 w-48' />
        <Skeleton className='h-10 w-32' />
      </div>
    </div>
  )
}

export function FAQItemSkeleton() {
  return (
    <div className='border rounded-lg overflow-hidden p-4'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-5 w-full max-w-md' />
        <Skeleton className='h-4 w-4 flex-shrink-0 ml-4' />
      </div>
    </div>
  )
}

export function FAQCardSkeleton({ itemCount = 4 }: { itemCount?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-6 w-48' />
      </CardHeader>
      <CardContent className='space-y-2'>
        {[...Array(itemCount)].map((_, i) => (
          <FAQItemSkeleton key={i} />
        ))}
      </CardContent>
    </Card>
  )
}

export function FAQTabSkeleton({ cardCount = 3 }: { cardCount?: number }) {
  return (
    <div className='space-y-4'>
      {[...Array(cardCount)].map((_, i) => (
        <FAQCardSkeleton key={i} itemCount={4} />
      ))}
    </div>
  )
}

export function TicketCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-6 w-64' />
            <Skeleton className='h-4 w-full' />
          </div>
          <Skeleton className='h-6 w-20 flex-shrink-0 ml-4' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-4 w-4' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-4' />
          <Skeleton className='h-4 w-24' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {[...Array(2)].map((_, i) => (
            <div key={i} className='flex gap-3'>
              <Skeleton className='h-8 w-8 rounded-full flex-shrink-0' />
              <div className='flex-1 space-y-2'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-3 w-32' />
                </div>
                <Skeleton className='h-4 w-full' />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function TicketsTabSkeleton({ itemCount = 3 }: { itemCount?: number }) {
  return (
    <div className='space-y-4'>
      {[...Array(itemCount)].map((_, i) => (
        <TicketCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function HelpCenterPageSkeleton() {
  return (
    <div className='flex flex-1 flex-col'>
      {/* Header */}
      <HelpCenterPageHeaderSkeleton />

      {/* Tabs List and Filter Toolbar */}
      <HelpCenterTabsListSkeleton />

      {/* FAQ Content Skeleton */}
      <div className='mt-4 space-y-4'>
        <FAQTabSkeleton cardCount={3} />
      </div>
    </div>
  )
}
