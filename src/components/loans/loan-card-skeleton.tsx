'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from 'lucide-react'

export function LoansPageHeaderSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-24 mt-4 md:mt-0" />
    </div>
  )
}

export function LoansTabsHeaderSkeleton() {
  return (
    <div className="flex gap-2">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>
  )
}

export function LoanCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-20 w-16 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="pt-2 border-t">
            <Skeleton className="h-5 w-24" />
          </div>
        </div>

        <Skeleton className="w-full mt-4 h-9" />
      </CardContent>
    </Card>
  )
}

export function LoanCardCompactSkeleton() {
  return (
    <Card className="opacity-75">
      <CardContent className="p-6">
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-16 w-12 rounded flex-shrink-0 opacity-70" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function LoanListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <LoanCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function LoanPastListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <LoanCardCompactSkeleton key={i} />
      ))}
    </div>
  )
}
