import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { BillingManagement } from '@/components/subscription/billing-management'

export const metadata: Metadata = {
  title: 'Billing - Book Heaven',
  description: 'Manage your billing information and payment history',
}

export default async function BillingPage() {
  const session = await getSession()

  if (!session) {
    redirect('/auth/sign-in')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-2">
          Manage your billing information and view payment history
        </p>
      </div>

      <BillingManagement userId={session.userId} />
    </div>
  )
}
