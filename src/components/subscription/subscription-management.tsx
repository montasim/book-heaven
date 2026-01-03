'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Check, Crown, Zap, Calendar, CreditCard, AlertCircle } from 'lucide-react'
import { SubscriptionPlan } from '@prisma/client'
import { SUBSCRIPTION_TIERS, formatPrice } from '@/lib/stripe/config'
import { CheckoutButton } from './checkout-button'
import { useToast } from '@/hooks/use-toast'

interface SubscriptionData {
  plan: SubscriptionPlan
  isActive: boolean
  startDate?: string
  endDate?: string
  cancelAtPeriodEnd?: boolean
}

interface SubscriptionManagementProps {
  userId: string
}

export function SubscriptionManagement({ userId }: SubscriptionManagementProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCanceling, setIsCanceling] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSubscription()
  }, [userId])

  async function fetchSubscription() {
    try {
      const response = await fetch('/api/stripe/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return
    }

    setIsCanceling(true)
    try {
      const response = await fetch('/api/stripe/subscription/cancel', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will be canceled at the end of your billing period.',
      })

      // Refetch subscription data
      await fetchSubscription()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel subscription',
        variant: 'destructive',
      })
    } finally {
      setIsCanceling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-8 bg-muted rounded w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentTier = subscription?.plan
    ? SUBSCRIPTION_TIERS[subscription.plan]
    : SUBSCRIPTION_TIERS[SubscriptionPlan.FREE]

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentTier.id === 'premium' && <Crown className="h-5 w-5 text-primary" />}
                {currentTier.id === 'premium-plus' && <Zap className="h-5 w-5 text-primary" />}
                {currentTier.name} Plan
              </CardTitle>
              <CardDescription>
                {subscription?.plan === SubscriptionPlan.FREE
                  ? 'You are on the free plan'
                  : subscription?.isActive
                  ? 'Your subscription is active'
                  : 'Your subscription is inactive'}
              </CardDescription>
            </div>
            <Badge variant={subscription?.plan === SubscriptionPlan.FREE ? 'secondary' : 'default'}>
              {subscription?.plan === SubscriptionPlan.FREE ? 'Free' : 'Premium'}
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {subscription?.plan === SubscriptionPlan.FREE ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upgrade to Premium</h3>
                <p className="text-muted-foreground mb-4">
                  Get unlimited access to all features and unlock the full potential of Book Heaven
                </p>
                <Button asChild>
                  <a href="/pricing">View Pricing Plans</a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {subscription?.startDate && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Start Date</span>
                  </div>
                  <span className="text-sm font-medium">
                    {new Date(subscription.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {subscription?.endDate && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Next Billing Date</span>
                  </div>
                  <span className="text-sm font-medium">
                    {new Date(subscription.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {subscription?.cancelAtPeriodEnd && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Subscription Canceled
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your subscription will be canceled on {new Date(subscription.endDate || '').toLocaleDateString()}.
                    You will lose access to premium features on that date.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {!subscription?.cancelAtPeriodEnd && (
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={isCanceling}
                  >
                    {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      {subscription?.plan !== SubscriptionPlan.PREMIUM_PLUS && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>
              Get more features and unlock the full potential of Book Heaven
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {subscription?.plan === SubscriptionPlan.FREE && (
                <>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Premium</h3>
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      ${formatPrice(SUBSCRIPTION_TIERS.PREMIUM.price.monthly)}/mo
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Perfect for avid readers
                    </p>
                    <CheckoutButton
                      plan={SubscriptionPlan.PREMIUM}
                      interval="month"
                      className="w-full"
                    >
                      Upgrade to Premium
                    </CheckoutButton>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Premium Plus</h3>
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      ${formatPrice(SUBSCRIPTION_TIERS.PREMIUM_PLUS.price.monthly)}/mo
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ultimate experience
                    </p>
                    <CheckoutButton
                      plan={SubscriptionPlan.PREMIUM_PLUS}
                      interval="month"
                      className="w-full"
                    >
                      Upgrade to Premium Plus
                    </CheckoutButton>
                  </div>
                </>
              )}

              {subscription?.plan === SubscriptionPlan.PREMIUM && (
                <div className="border rounded-lg p-4 md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Premium Plus</h3>
                  </div>
                  <div className="text-2xl font-bold mb-2">
                    ${formatPrice(SUBSCRIPTION_TIERS.PREMIUM_PLUS.price.monthly)}/mo
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unlock unlimited uploads and priority support
                  </p>
                  <CheckoutButton
                    plan={SubscriptionPlan.PREMIUM_PLUS}
                    interval="month"
                    className="w-full md:w-auto"
                  >
                    Upgrade to Premium Plus
                  </CheckoutButton>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>Your Current Plan Features</CardTitle>
          <CardDescription>
            Features included in your {currentTier.name} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {currentTier.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                {feature.included ? (
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 flex-shrink-0 mt-0.5 opacity-30">
                    <Check className="h-5 w-5" />
                  </div>
                )}
                <span
                  className={feature.included ? 'text-foreground' : 'text-muted-foreground'}
                >
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
