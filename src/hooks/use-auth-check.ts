'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/context/auth-context'

interface UseAuthCheckOptions {
  redirectTo?: string
}

/**
 * Hook to handle authentication failures and redirect to sign-in.
 * It uses the central AuthContext to check the user's status.
 */
export function useAuthCheck(options: UseAuthCheckOptions = {}) {
  const { redirectTo = '/auth/sign-in' } = options
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Wait for the initial auth check to complete
    if (isLoading) {
      return
    }

    // If there is no user, redirect to the sign-in page
    if (!user) {
      console.log('AuthGuard: User not found, redirecting to sign-in...')
      router.push(redirectTo)
    }
  }, [user, isLoading, router, redirectTo])
}
