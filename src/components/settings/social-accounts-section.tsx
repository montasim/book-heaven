"use client"

import { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Trash2 } from 'lucide-react'
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

interface SocialAccount {
  id: string
  provider: 'GOOGLE' | 'GITHUB'
  providerEmail: string
  avatar?: string
  profileUrl?: string
  createdAt: string
  lastUsedAt: string
}

export function SocialAccountsSection() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

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

  async function revokeAccount(provider: string) {
    setRevoking(provider)

    try {
      const response = await fetch(`/api/user/social-accounts/${provider}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Failed to revoke',
          description: data.error || 'Could not remove social account'
        })
        return
      }

      toast({
        title: 'Success',
        description: data.message || 'Social account removed'
      })

      // Refresh the list
      await fetchAccounts()
    } catch (error) {
      console.error('Failed to revoke social account:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove social account'
      })
    } finally {
      setRevoking(null)
    }
  }

  const getProviderInfo = (provider: 'GOOGLE' | 'GITHUB') => {
    switch (provider) {
      case 'GOOGLE':
        return {
          name: 'Google',
          icon: '🔵',
          color: 'text-red-500'
        }
      case 'GITHUB':
        return {
          name: 'GitHub',
          icon: '🐱',
          color: 'text-gray-800'
        }
      default:
        return {
          name: provider,
          icon: '🔗',
          color: ''
        }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          Sign in quickly with your connected social accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No social accounts connected</p>
            <p className="text-sm mt-2">
              You can add social logins on the sign-in page
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => {
              const providerInfo = getProviderInfo(account.provider)

              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{providerInfo.icon}</div>
                    <div>
                      <p className="font-medium">{providerInfo.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.providerEmail}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Connected {new Date(account.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={revoking === account.provider}
                      >
                        {revoking === account.provider ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {providerInfo.name} Account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will disconnect your {providerInfo.name} account. You won't be able to sign in with {providerInfo.name} anymore.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => revokeAccount(account.provider)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed">
          <p className="text-sm text-center text-muted-foreground mb-3">
            Want to add more social logins?
          </p>
          <div className="flex gap-2 justify-center text-xs text-muted-foreground">
            <span>🔵 Google</span>
            <span>🐱 GitHub</span>
          </div>
          <p className="text-xs text-center mt-2">
            Sign out and sign in again with your preferred social account to connect it
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
