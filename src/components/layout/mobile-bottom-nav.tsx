'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/routes/client-routes'

// Define which routes to show in mobile nav using route keys
const MOBILE_NAV_KEYS = ['books', 'library', 'quiz', 'settings'] as const

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16 [padding-bottom:env(safe-area-inset-bottom)]">
        {MOBILE_NAV_KEYS.map((key) => {
          const route = ROUTES[key]
          const isActive = pathname === route.href || pathname.startsWith(route.href)

          return (
            <Link
              key={key}
              href={route.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <route.icon
                className={cn(
                  'h-5 w-5 mb-1 transition-all duration-200',
                  isActive && 'scale-110'
                )}
              />
              <span className="text-xs font-medium">
                {route.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
