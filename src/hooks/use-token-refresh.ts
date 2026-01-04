'use client'

import { useEffect, useCallback, useRef } from 'react'

interface TokenData {
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
  refreshTokenExpiresAt: string
}

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes before expiry

/**
 * Hook to automatically refresh access tokens before they expire
 * Stores tokens in localStorage and handles automatic refresh
 */
export function useTokenRefresh() {
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  /**
   * Get tokens from localStorage
   */
  const getTokens = useCallback((): TokenData | null => {
    if (typeof window === 'undefined') return null

    const tokensStr = localStorage.getItem('auth_tokens')
    if (!tokensStr) return null

    try {
      return JSON.parse(tokensStr)
    } catch {
      return null
    }
  }, [])

  /**
   * Save tokens to localStorage
   */
  const saveTokens = useCallback((tokens: TokenData) => {
    if (typeof window === 'undefined') return

    localStorage.setItem('auth_tokens', JSON.stringify(tokens))

    // Schedule next refresh
    scheduleRefresh(tokens)
  }, [])

  /**
   * Clear tokens from localStorage
   */
  const clearTokens = useCallback(() => {
    if (typeof window === 'undefined') return

    localStorage.removeItem('auth_tokens')

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
  }, [])

  /**
   * Refresh the access token
   */
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      return false
    }

    const tokens = getTokens()
    if (!tokens) {
      return false
    }

    isRefreshingRef.current = true

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      })

      const result = await response.json()

      if (result.success) {
        saveTokens(result.data)
        return true
      } else {
        // Refresh token is invalid or expired, user needs to login again
        clearTokens()
        window.location.href = '/auth/sign-in?session=expired'
        return false
      }
    } catch (error) {
      console.error('Failed to refresh tokens:', error)
      return false
    } finally {
      isRefreshingRef.current = false
    }
  }, [getTokens, saveTokens, clearTokens])

  /**
   * Schedule token refresh before it expires
   */
  const scheduleRefresh = useCallback((tokens: TokenData) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    const expiresAt = new Date(tokens.accessTokenExpiresAt).getTime()
    const now = Date.now()
    const timeUntilExpiry = expiresAt - now

    // If token expires in less than threshold, refresh immediately
    // Otherwise, refresh threshold milliseconds before expiry
    const refreshDelay = Math.max(
      0,
      Math.min(timeUntilExpiry - TOKEN_REFRESH_THRESHOLD, timeUntilExpiry)
    )

    refreshTimeoutRef.current = setTimeout(() => {
      refreshTokens()
    }, refreshDelay)
  }, [refreshTokens])

  /**
   * Initialize token refresh on mount
   */
  useEffect(() => {
    const tokens = getTokens()

    if (tokens) {
      const expiresAt = new Date(tokens.accessTokenExpiresAt).getTime()
      const now = Date.now()

      // If access token is expired, refresh immediately
      if (now >= expiresAt) {
        refreshTokens()
      } else {
        // Schedule refresh
        scheduleRefresh(tokens)
      }
    }

    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [getTokens, scheduleRefresh, refreshTokens])

  /**
   * Initialize with new tokens (call this after login)
   */
  const initializeTokens = useCallback((tokens: TokenData) => {
    saveTokens(tokens)
  }, [saveTokens])

  /**
   * Manually trigger a token refresh
   */
  const manualRefresh = useCallback(() => {
    return refreshTokens()
  }, [refreshTokens])

  return {
    initializeTokens,
    clearTokens,
    manualRefresh,
    getTokens,
  }
}
