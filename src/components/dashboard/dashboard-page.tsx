import { type ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DashboardPageHeaderActions, type ActionConfig } from '@/components/dashboard/dashboard-page-header-actions'

interface DashboardPageProps {
  icon?: LucideIcon
  title: string
  description?: string
  actions?: ActionConfig[] | ReactNode
  children: ReactNode
  className?: string
}

/**
 * Unified dashboard page wrapper
 * Combines PageContainer + PageHeader into a single component
 * Use this for all dashboard pages to ensure consistent layout
 */
export function DashboardPage({
  icon,
  title,
  description,
  actions,
  children,
  className,
}: DashboardPageProps) {
  // If actions is an array, wrap it in DashboardPageHeaderActions
  const renderedActions = Array.isArray(actions)
    ? <DashboardPageHeaderActions actions={actions} />
    : actions

  return (
    <div className='space-y-4 pb-6 overflow-y-auto h-full'>
      <PageHeader icon={icon} title={title} description={description} actions={renderedActions} />
      {children}
    </div>
  )
}
