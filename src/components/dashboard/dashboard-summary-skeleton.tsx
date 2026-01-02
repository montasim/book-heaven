'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDown } from 'lucide-react'

export function DashboardSummarySkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {/* Mobile Header */}
      <div className="flex items-center justify-between md:hidden">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(count)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-5" />
                </div>
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
