'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Loader2, Save, RefreshCw, Construction, Settings, Palette, Search, Mail } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GeneralTab } from './components/general-tab'
import { BrandingTab } from './components/branding-tab'
import { SEOTab } from './components/seo-tab'
import { ContactTab } from './components/contact-tab'

interface SiteSettings {
  id: string
  underConstruction: boolean
  underConstructionMessage: string | null
  maintenanceMode: boolean
  maintenanceMessage: string | null

  // Branding
  siteName: string
  siteSlogan: string | null
  logoUrl: string | null
  directLogoUrl: string | null
  faviconUrl: string | null
  directFaviconUrl: string | null

  // SEO
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  ogImage: string | null
  directOgImageUrl: string | null

  // Contact
  supportEmail: string | null
  contactEmail: string | null
  socialTwitter: string | null
  socialGithub: string | null
  socialFacebook: string | null
  socialInstagram: string | null
  socialLinkedIn: string | null

  createdAt: string
  updatedAt: string
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [underConstructionMessage, setUnderConstructionMessage] = useState('')
  const [activeTab, setActiveTab] = useState('general')

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
          ...settings,
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

        {/* Tabs skeleton */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
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
            <Settings className="h-6 w-6" />
            Site Settings
          </h1>
          <p className="text-muted-foreground">
            Manage site-wide settings, branding, SEO, and contact information
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="pb-20">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
          <TabsTrigger value="general" className="gap-2">
            <Construction className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab
            settings={settings}
            setSettings={setSettings}
            underConstructionMessage={underConstructionMessage}
            setUnderConstructionMessage={setUnderConstructionMessage}
            isSaving={isSaving}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingTab
            settings={settings}
            setSettings={setSettings}
            isSaving={isSaving}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="seo">
          <SEOTab
            settings={settings}
            setSettings={setSettings}
            isSaving={isSaving}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="contact">
          <ContactTab
            settings={settings}
            setSettings={setSettings}
            isSaving={isSaving}
            onSave={handleSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
