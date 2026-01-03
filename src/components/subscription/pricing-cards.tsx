'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Check, Zap, Crown } from 'lucide-react'
import { SUBSCRIPTION_TIERS, formatPrice, getYearlySavings } from '@/lib/stripe/config'
import { SubscriptionPlan } from '@prisma/client'
import { CheckoutButton } from './checkout-button'

interface PricingCardsProps {
  currentPlan?: SubscriptionPlan
}

export function PricingCards({ currentPlan = SubscriptionPlan.FREE }: PricingCardsProps) {
  const [interval, setInterval] = useState<'month' | 'year'>('month')

  const tiers = Object.values(SUBSCRIPTION_TIERS)

  return (
    <div className="space-y-8">
      {/* Billing Interval Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm ${interval === 'month' ? 'text-foreground' : 'text-muted-foreground'}`}>
          Monthly
        </span>
        <Switch
          checked={interval === 'year'}
          onCheckedChange={(checked) => setInterval(checked ? 'year' : 'month')}
        />
        <span className={`text-sm ${interval === 'year' ? 'text-foreground' : 'text-muted-foreground'}`}>
          Yearly
        </span>
        {interval === 'year' && (
          <Badge variant="secondary" className="ml-2">
            Save up to 17%
          </Badge>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {tiers.map((tier) => {
          const price = interval === 'month' ? tier.price.monthly : tier.price.yearly
          const savings = interval === 'year'
            ? getYearlySavings(tier.price.monthly, tier.price.yearly)
            : 0

          return (
            <Card
              key={tier.id}
              className={`relative ${
                tier.popular
                  ? 'border-primary shadow-lg scale-105'
                  : 'border-border'
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  {tier.id === 'premium' && <Crown className="h-6 w-6 text-primary" />}
                  {tier.id === 'premium-plus' && <Zap className="h-6 w-6 text-primary" />}
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                </div>
                <CardDescription>{tier.description}</CardDescription>

                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${formatPrice(price)}</span>
                    <span className="text-muted-foreground">/{interval}</span>
                  </div>
                  {interval === 'year' && tier.id !== 'free' && savings > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Save {savings}% compared to monthly
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      ) : (
                        <div className="h-5 w-5 flex-shrink-0 mt-0.5 opacity-30">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                      <span
                        className={
                          feature.included ? 'text-foreground' : 'text-muted-foreground'
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {tier.id === 'free' ? (
                  <Button
                    variant={currentPlan === SubscriptionPlan.FREE ? 'secondary' : 'outline'}
                    className="w-full"
                    disabled={currentPlan === SubscriptionPlan.FREE}
                  >
                    {currentPlan === SubscriptionPlan.FREE ? 'Current Plan' : 'Downgrade'}
                  </Button>
                ) : (
                  <CheckoutButton
                    plan={tier.id.toUpperCase() as SubscriptionPlan}
                    interval={interval}
                    disabled={currentPlan === tier.id.toUpperCase()}
                    className="w-full"
                  >
                    {currentPlan === tier.id.toUpperCase() ? 'Current Plan' : 'Subscribe'}
                  </CheckoutButton>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
