import { Skeleton } from '@/components/ui/skeleton'

interface PageSkeletonProps {
  tabCount?: number
  hasAction?: boolean
}

/**
 * Standardized page skeleton loading state
 * Follows the site-settings pattern for consistency
 */
export function PageSkeleton({ tabCount = 0, hasAction = false }: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        {hasAction && <Skeleton className="h-10 w-24" />}
      </div>

      {/* Tabs skeleton */}
      {tabCount > 0 && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: tabCount }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      )}
    </div>
  )
}
