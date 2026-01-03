import { Metadata } from 'next'
import { PricingCards } from '@/components/subscription/pricing-cards'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Pricing - Book Heaven',
  description: 'Choose the perfect plan for your reading journey',
}

export default async function PricingPage() {
  const session = await getSession()
  const currentPlan = session?.isPremium ? 'PREMIUM' : 'FREE'

  return (
    <div className="min-h-screen">
      <main className="container mx-auto p-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 space-y-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Choose Your Perfect Plan
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Unlock the full potential of Book Heaven with our premium subscription plans.
            Start free, upgrade when you're ready.
          </p>
        </div>

        {/* Pricing Cards */}
        <PricingCards currentPlan={currentPlan as any} />

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-2">Can I change or cancel my plan anytime?</h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the end of your billing period.
              </p>
            </div>
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards including Visa, MasterCard, and American Express through our secure Stripe payment system.
              </p>
            </div>
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                Currently, we don't offer a free trial, but you can start with our free plan which gives you access to basic features and up to 10 book uploads.
              </p>
            </div>
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-2">What happens if I cancel?</h3>
              <p className="text-muted-foreground">
                If you cancel, you'll keep your premium features until the end of your billing period. After that, your account will revert to the free plan.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
