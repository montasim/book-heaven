'use client'

import { type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'

export interface ActionConfig {
  /** Button label (hidden on mobile by default) */
  label: string
  /** Icon to display - must be a Lucide icon component */
  icon?: LucideIcon
  /** Click handler */
  onClick?: () => void
  /** Navigation href - if provided, renders as Link component */
  href?: string
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary'
  /** Disable the button */
  disabled?: boolean
  /** Loading state */
  loading?: boolean
  /** Show as icon-only button (always true on mobile) */
  iconOnly?: boolean
  /** Custom className */
  className?: string
}

interface DashboardPageHeaderActionsProps {
  /** Array of action configurations */
  actions: ActionConfig[]
  /** Container className */
  className?: string
}

export function DashboardPageHeaderActions({
  actions,
  className
}: DashboardPageHeaderActionsProps) {
  return (
    <div className={cn('flex items-center gap-4 flex-wrap', className)}>
      {actions.map((action, index) => {
        const {
          label,
          icon: Icon,
          onClick,
          href,
          variant = 'default',
          disabled = false,
          loading = false,
          iconOnly = false,
          className: actionClassName,
        } = action

        const buttonContent = (
          <>
            {Icon && <Icon className="h-4 w-4" />}
            {loading ? (
              <span className="hidden sm:inline">
                {label}...
              </span>
            ) : (
              <span className={iconOnly ? 'hidden' : 'hidden sm:inline'}>
                {label}
              </span>
            )}
          </>
        )

        // If href is provided, render as Link
        if (href) {
          return (
            <>
              {/* Icon-only version for mobile */}
              <Link key={`${index}-mobile`} href={href} className={cn('sm:hidden', actionClassName)}>
                <Button
                  variant={variant}
                  disabled={disabled || loading}
                  size="icon"
                  className="h-9 w-9"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                </Button>
              </Link>

              {/* Full button with label for desktop */}
              <Link key={`${index}-desktop`} href={href} className={cn('hidden sm:inline-flex', actionClassName)}>
                <Button
                  variant={variant}
                  disabled={disabled || loading}
                  size="sm"
                >
                  {buttonContent}
                </Button>
              </Link>
            </>
          )
        }

        // If iconOnly is true, only show icon button on all screens
        if (iconOnly) {
          return (
            <Button
              key={index}
              onClick={onClick}
              variant={variant}
              disabled={disabled || loading}
              size="icon"
              className={actionClassName}
            >
              {Icon && <Icon className="h-4 w-4" />}
            </Button>
          )
        }

        return (
          <>
            {/* Icon-only version for mobile */}
            <Button
              key={`${index}-mobile`}
              onClick={onClick}
              variant={variant}
              disabled={disabled || loading}
              size="icon"
              className={cn('sm:hidden', actionClassName)}
            >
              {Icon && <Icon className="h-4 w-4" />}
            </Button>

            {/* Full button with label for desktop */}
            <Button
              key={`${index}-desktop`}
              onClick={onClick}
              variant={variant}
              disabled={disabled || loading}
              size="sm"
              className={cn('hidden sm:flex', actionClassName)}
            >
              {buttonContent}
            </Button>
          </>
        )
      })}
    </div>
  )
}
