import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

/**
 * Standardized page container following the site-settings pattern
 * Provides consistent spacing and scroll behavior across all dashboard pages
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('pb-6 overflow-y-auto h-full', className)}>
      {children}
    </div>
  )
}

interface PageContentProps {
  children: ReactNode
  className?: string
}

/**
 * Content wrapper for page content
 * Removes the problematic -mx-4 overflow-auto pattern
 */
export function PageContent({ children, className }: PageContentProps) {
  return <div className={cn('flex-1', className)}>{children}</div>
}
