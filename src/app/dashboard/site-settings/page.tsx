'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Loader2, Save, RefreshCw, Construction } from 'lucide-react'
import { HeaderContainer } from '@/components/ui/header-container'
import { Skeleton } from '@/components/ui/skeleton'

interface SiteSettings {
  id: string
  underConstruction: boolean
  underConstructionMessage: string | null
  maintenanceMode: boolean
  maintenanceMessage: string | null
  createdAt: string
  updatedAt: string
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [underConstructionMessage, setUnderConstructionMessage] = useState('')

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/admin/site/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.data)
        setUnderConstructionMessage(data.data.underConstructionMessage || '')
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch site settings',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch site settings',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    try {
      setIsSaving(true)
      const res = await fetch('/api/admin/site/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          underConstruction: settings.underConstruction,
          underConstructionMessage: underConstructionMessage,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data.data)
        toast({
          title: 'Success',
          description: 'Site settings updated successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update site settings',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to update site settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Settings Card skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-56 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Switch skeleton */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-80" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>

            {/* Textarea skeleton */}
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-3 w-64" />
            </div>

            {/* Save button skeleton */}
            <div className="flex justify-end pt-4">
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Failed to load settings</p>
      </div>
    )
  }

  return (
    <div className="pb-safe-bottom">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Construction className="h-6 w-6" />
                    Site Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage site-wide settings and maintenance modes
                </p>
            </div>

            <Button
                variant="outline"
                onClick={fetchSettings}
                disabled={isLoading}
                size="sm"
            >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-2">Refresh</span>
            </Button>
        </div>

      <div className="space-y-6 pb-20">
        {/* Under Construction Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Under Construction Mode</CardTitle>
            <CardDescription>
              Enable to show a banner on all public pages informing users that the site is under construction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1 pr-4">
                <Label htmlFor="under-construction" className="text-base">Enable Under Construction Banner</Label>
                <p className="text-sm text-muted-foreground">
                  Show a banner below the navbar on all public pages
                </p>
              </div>
              <Switch
                id="under-construction"
                checked={settings.underConstruction}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, underConstruction: checked })
                }
              />
            </div>

            {settings.underConstruction && (
              <div className="space-y-2 pt-4">
                <Label htmlFor="message" className="text-base">Banner Message</Label>
                <Textarea
                  id="message"
                  placeholder="Site is under construction. Some features may not work as expected."
                  value={underConstructionMessage}
                  onChange={(e) => setUnderConstructionMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  This message will be displayed to all users on the public pages
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Save</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Save Changes</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {settings.underConstruction && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Banner Preview</CardTitle>
              <CardDescription>
                This is how the banner will appear on public pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-b-2 border-amber-500/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-t-lg">
                <div className="px-3 py-2 sm:px-4">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
                    <Construction className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <p className="text-amber-900 dark:text-amber-100 font-medium">
                      {underConstructionMessage || 'Site is under construction. Some features may not work as expected.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
