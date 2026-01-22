'use client'

import { Turnstile as TurnstileComponent } from '@marsidev/react-turnstile'
import { forwardRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TurnstileProps {
  siteKey?: string
  onSuccess?: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  className?: string
}

const Turnstile = forwardRef<any, TurnstileProps>(
  ({ siteKey, onSuccess, onError, onExpire, className }, ref) => {
    const [isMounted, setIsMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
      setIsMounted(true)
    }, [])

    const defaultSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    if (!isMounted) {
      return (
        <div
          className={cn(
            'h-[65px] w-[300px] bg-muted rounded-md animate-pulse',
            className
          )}
        />
      )
    }

    if (!defaultSiteKey && !siteKey) {
      console.warn('Turnstile site key is not configured')
      return null
    }

    return (
      <TurnstileComponent
        ref={ref}
        siteKey={siteKey || defaultSiteKey!}
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        options={{
          theme: 'auto',
          size: 'normal',
        }}
        className={className}
        scriptOptions={{
          appendTo: 'body',
        }}
      />
    )
  }
)

Turnstile.displayName = 'Turnstile'

export { Turnstile }
