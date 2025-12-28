'use client'

import { cn } from '@/lib/utils'
import { UserTopbar } from './user-topbar'

interface PublicHeaderProps {
  className?: string
}

export function PublicHeader({ className }: PublicHeaderProps) {
  return (
    <div className={cn(
      'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50',
      className
    )}>
      <div className="container mx-auto">
        <UserTopbar showSearch={false} />
      </div>
    </div>
  )
}