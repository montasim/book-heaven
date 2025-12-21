'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthCheck } from '@/hooks/use-auth-check'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * Component to protect routes that require authentication
 * Automatically checks authentication status and redirects on failure
 */
export function AuthGuard({ children, redirectTo = '/auth/sign-in' }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { checkAuthAndRedirect } = useAuthCheck({ redirectTo })

  useEffect(() => {
    // Only check auth on dashboard routes
    if (pathname.startsWith('/dashboard')) {
      checkAuthAndRedirect()
    }
  }, [pathname, checkAuthAndRedirect])

  return <>{children}</>
}