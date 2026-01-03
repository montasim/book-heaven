'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { SubscriptionPlan } from '@prisma/client'

interface CheckoutButtonProps {
  plan: SubscriptionPlan
  interval: 'month' | 'year'
  disabled?: boolean
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  className?: string
}

export function CheckoutButton({
  plan,
  interval,
  disabled = false,
  children,
  variant = 'default',
  className = '',
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    if (isLoading || disabled) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          interval,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert(error.message || 'Failed to proceed to checkout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      className={className}
      disabled={disabled || isLoading}
      onClick={handleCheckout}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  )
}
