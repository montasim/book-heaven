'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Download, CreditCard, Calendar, DollarSign, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface Invoice {
  id: string
  amountPaid: number
  currency: string
  status: string
  created: number
  hostedInvoiceUrl?: string
  invoicePdf?: string
}

interface BillingData {
  customerId?: string
  defaultPaymentMethod?: {
    last4: string
    brand: string
    expMonth: number
    expYear: number
  }
  invoices?: Invoice[]
}

interface BillingManagementProps {
  userId: string
}

export function BillingManagement({ userId }: BillingManagementProps) {
  const [billing, setBilling] = useState<BillingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBillingData()
  }, [userId])

  async function fetchBillingData() {
    try {
      const response = await fetch('/api/stripe/billing')
      if (response.ok) {
        const data = await response.json()
        setBilling(data)
      }
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDownloadInvoice(invoiceId: string, invoicePdf?: string) {
    if (invoicePdf) {
      window.open(invoicePdf, '_blank')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Your default payment method for subscriptions
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {billing?.defaultPaymentMethod ? (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize">
                    {billing.defaultPaymentMethod.brand}
                  </span>
                  <Badge variant="secondary">Default</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  •••• •••• •••• {billing.defaultPaymentMethod.last4}
                </p>
                <p className="text-sm text-muted-foreground">
                  Expires {billing.defaultPaymentMethod.expMonth}/{billing.defaultPaymentMethod.expYear}
                </p>
              </div>
              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payment Method</h3>
              <p className="text-muted-foreground mb-4">
                Add a payment method to purchase a subscription
              </p>
              <Button asChild>
                <a href="/pricing">Add Payment Method</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>
            View and download your invoices
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {billing?.invoices && billing.invoices.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billing.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(invoice.created * 1000), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">Invoice #{invoice.id.slice(-8)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {(invoice.amountPaid / 100).toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground uppercase">
                            {invoice.currency}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === 'paid' ? 'default' :
                            invoice.status === 'open' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.hostedInvoiceUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice.id, invoice.invoicePdf)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Billing History</h3>
              <p className="text-muted-foreground">
                Your invoices will appear here once you make a purchase
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
          <CardDescription>
            Manage your billing details
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  Invoices will be sent to this email
                </p>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Billing Address</p>
                <p className="text-sm text-muted-foreground">
                  Add a billing address for your invoices
                </p>
              </div>
              <Button variant="outline" size="sm">
                Add Address
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
