"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { IconBrandGithub, IconBrandGoogle } from '@tabler/icons-react'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ROUTES } from '@/lib/routes/client-routes'

interface SocialAccount {
  id: string
  provider: 'GOOGLE' | 'GITHUB'
  providerEmail: string
  avatar?: string
  profileUrl?: string
  createdAt: string
  lastUsedAt: string
}

type Provider = 'GOOGLE' | 'GITHUB'

export function SocialAccountsSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<Provider | null>(null)
  const [pendingDisconnect, setPendingDisconnect] = useState<Provider | null>(null)

  useEffect(() => {
    fetchAccounts()

    // Check if user was redirected after connecting an account
    const connected = searchParams.get('connected')
    if (connected) {
      toast({
        title: 'Account connected',
        description: `${connected === 'google' ? 'Google' : 'GitHub'} account has been connected successfully`,
      })
      // Clean up the URL
      router.replace('/dashboard/settings/account', { scroll: false })
    }
  }, [searchParams, router])

  async function fetchAccounts() {
    try {
      const response = await fetch('/api/user/social-accounts')
      const data = await response.json()

      if (response.ok) {
        setAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error('Failed to fetch social accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function revokeAccount(provider: Provider) {
    setRevoking(provider)
    setPendingDisconnect(null)

    try {
      const response = await fetch(`/api/user/social-accounts/${provider.toLowerCase()}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Failed to disconnect',
          description: data.error || 'Could not disconnect social account'
        })
        return
      }

      toast({
        title: 'Account disconnected',
        description: data.message || 'Social account removed successfully'
      })

      await fetchAccounts()
    } catch (error) {
      console.error('Failed to revoke social account:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to disconnect social account'
      })
    } finally {
      setRevoking(null)
    }
  }

  const getProviderInfo = (provider: Provider) => {
    switch (provider) {
      case 'GOOGLE':
        return {
          name: 'Google',
          icon: <IconBrandGoogle className='h-5 w-5' />,
          description: 'Sign in quickly with your Google account'
        }
      case 'GITHUB':
        return {
          name: 'GitHub',
          icon: <IconBrandGithub className='h-5 w-5' />,
          description: 'Sign in quickly with your GitHub account'
        }
    }
  }

  const isProviderConnected = (provider: Provider) => {
    return accounts.some(acc => acc.provider === provider)
  }

  const handleProviderToggle = (provider: Provider, checked: boolean) => {
    if (checked) {
      // Redirect to sign-in page with callback URL
      const signInUrl = `${ROUTES.signIn.href}?redirect=${encodeURIComponent('/dashboard/settings/account')}&connect=${provider.toLowerCase()}`
      router.push(signInUrl)
    } else {
      // Show confirmation dialog for disconnect
      setPendingDisconnect(provider)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your social login accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const providers: Provider[] = ['GOOGLE', 'GITHUB']

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          Connect your Google or GitHub account for quick sign-in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {providers.map((provider) => {
            const isConnected = isProviderConnected(provider)
            const providerInfo = getProviderInfo(provider)
            const account = accounts.find(acc => acc.provider === provider)

            return (
              <div
                key={provider}
                className="flex flex-row items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {providerInfo.icon}
                    <p className="text-base font-medium">{providerInfo.name}</p>
                  </div>
                  {isConnected && account ? (
                    <p className="text-sm text-muted-foreground">
                      Connected as {account.providerEmail}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {providerInfo.description}
                    </p>
                  )}
                </div>
                {isConnected ? (
                  <AlertDialog
                    open={pendingDisconnect === provider}
                    onOpenChange={(open) => {
                      if (!open) setPendingDisconnect(null)
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <div className="cursor-pointer">
                        <Switch
                          checked={true}
                          disabled={revoking === provider}
                        />
                      </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect {providerInfo.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will disconnect your {providerInfo.name} account. You won&apos;t be able to sign in with {providerInfo.name} anymore.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => revokeAccount(provider)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={revoking === provider}
                        >
                          {revoking === provider ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Disconnecting...
                            </>
                          ) : (
                            'Disconnect'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Switch
                    checked={false}
                    onCheckedChange={(checked) => handleProviderToggle(provider, checked)}
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed">
          <p className="text-sm text-center text-muted-foreground">
            Toggle a provider to connect, then sign in with that account to complete the connection
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
