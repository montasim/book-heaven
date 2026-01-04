'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, getYearlySavings } from '@/lib/stripe/config'
import { SubscriptionPlan } from '@prisma/client'
import { CheckoutButton } from '@/components/subscription/checkout-button'
import { useState, useEffect } from 'react'

interface PricingFeature {
  id: string
  tierId: string
  text: string
  included: boolean
  order: number
}

interface PricingTier {
  id: string
  plan: SubscriptionPlan
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  popular: boolean
  stripeMonthlyPriceId: string | null
  stripeYearlyPriceId: string | null
  isActive: boolean
  order: number
  features: PricingFeature[]
}

interface PricingCardsProps {
  interval?: 'month' | 'year'
  currentPlan?: SubscriptionPlan
  showCheckoutButton?: boolean
}

export function PricingCards({
  interval = 'month',
  currentPlan = SubscriptionPlan.FREE,
  showCheckoutButton = true,
}: PricingCardsProps) {
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPricingTiers()
  }, [])

  const fetchPricingTiers = async () => {
    try {
      const response = await fetch('/api/pricing')
      const result = await response.json()
      if (result.success) {
        setTiers(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch pricing tiers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-96">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading...</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (tiers.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No pricing tiers available. Please contact support.
      </div>
    )
  }

  return (
    <div className="grid gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {tiers.map((tier) => {
        const price = interval === 'month' ? tier.monthlyPrice : tier.yearlyPrice
        const isCurrentPlan = tier.plan === currentPlan
        const savings = interval === 'year' ? getYearlySavings(tier.monthlyPrice, tier.yearlyPrice) : 0

        return (
          <Card
            key={tier.id}
            className={`relative ${tier.popular ? 'border-primary shadow-lg scale-105' : ''}`}
          >
            {tier.popular && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2" variant="default">
                Most Popular
              </Badge>
            )}

            <CardHeader>
              <CardTitle className="text-xl">{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${formatPrice(price)}</span>
                  <span className="text-muted-foreground">/{interval}</span>
                </div>
                {savings > 0 && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Save {savings}% with yearly billing
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {tier.features.map((feature) => (
                <div key={feature.id} className="flex items-start gap-2">
                  <Check
                    className={`h-5 w-5 mt-0.5 ${feature.included ? 'text-green-600' : 'text-muted-foreground'}`}
                  />
                  <span
                    className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}
                  >
                    {feature.text}
                  </span>
                </div>
              ))}
            </CardContent>

            <CardFooter>
              {isCurrentPlan ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : tier.plan === SubscriptionPlan.FREE ? (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              ) : showCheckoutButton ? (
                <CheckoutButton
                  plan={tier.plan}
                  interval={interval}
                  className="w-full"
                  variant={tier.popular ? 'default' : 'outline'}
                >
                  Upgrade to {tier.name}
                </CheckoutButton>
              ) : (
                <Button
                  className="w-full"
                  variant={tier.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href={`/pricing?plan=${tier.plan}&interval=${interval}`}>
                    Choose {tier.name}
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
