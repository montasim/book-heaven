'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useCallback } from 'react'

interface UseAuthCheckOptions {
  redirectTo?: string
  enabled?: boolean
}

/**
 * Hook to handle authentication failures and redirect to sign-in
 * Automatically checks authentication and redirects on failure
 */
export function useAuthCheck(options: UseAuthCheckOptions = {}) {
  const { redirectTo = '/auth/sign-in', enabled = true } = options
  const router = useRouter()
  const pathname = usePathname()

  const checkAuthAndRedirect = useCallback(async () => {
    if (!enabled) return

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Important for cookies
      })

      if (!response.ok) {
        // Authentication failed, redirect to sign-in
        console.log('Authentication failed, redirecting to sign-in...')
        router.push(redirectTo)
        return
      }

      const data = await response.json()
      if (!data.success) {
        // API returned success: false, redirect to sign-in
        console.log('API returned authentication failure, redirecting to sign-in...')
        router.push(redirectTo)
      }
    } catch (error) {
      // Network or other error, redirect to sign-in
      console.log('Auth check failed, redirecting to sign-in:', error)
      router.push(redirectTo)
    }
  }, [router, redirectTo, enabled])

  return { checkAuthAndRedirect }
}