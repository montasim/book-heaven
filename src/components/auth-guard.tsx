'use client'

import { useAuthCheck } from '@/hooks/use-auth-check'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * Component to protect routes that require authentication.
 * It uses the useAuthCheck hook which handles the redirect logic.
 */
export function AuthGuard({ children, redirectTo = '/auth/sign-in' }: AuthGuardProps) {
  useAuthCheck({ redirectTo })

  return <>{children}</>
}
