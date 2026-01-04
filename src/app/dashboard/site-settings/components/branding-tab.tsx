'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'

interface BrandingTabProps {
  settings: any
  setSettings: (settings: any) => void
  isSaving: boolean
  onSave: () => void
}

export function BrandingTab({ settings, setSettings, isSaving, onSave }: BrandingTabProps) {
  const handleLogoUpload = async (file: File | null) => {
    if (!file) return
    // TODO: Implement Google Drive upload
    console.log('Logo upload:', file)
  }

  const handleFaviconUpload = async (file: File | null) => {
    if (!file) return
    // TODO: Implement Google Drive upload
    console.log('Favicon upload:', file)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Branding Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Site Name */}
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={settings.siteName || 'Book Heaven'}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              placeholder="Book Heaven"
              maxLength={100}
            />
            <p className="text-sm text-muted-foreground">
              The name of your site (max 100 characters)
            </p>
          </div>

          {/* Site Slogan */}
          <div className="space-y-2">
            <Label htmlFor="siteSlogan">Site Slogan</Label>
            <Input
              id="siteSlogan"
              value={settings.siteSlogan || ''}
              onChange={(e) => setSettings({ ...settings, siteSlogan: e.target.value })}
              placeholder="AI-Powered Digital Library"
              maxLength={200}
            />
            <p className="text-sm text-muted-foreground">
              A short tagline that describes your site (max 200 characters)
            </p>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Site Logo</Label>
            <ImageUpload
              value={settings.logoUrl}
              directUrl={settings.directLogoUrl}
              onChange={handleLogoUpload}
              onRemove={() => setSettings({ ...settings, logoUrl: null, directLogoUrl: null })}
            />
            <p className="text-sm text-muted-foreground">
              Upload your site logo. Recommended size: 200x60px. Max file size: 5MB.
            </p>
          </div>

          {/* Favicon Upload */}
          <div className="space-y-2">
            <Label>Favicon</Label>
            <ImageUpload
              value={settings.faviconUrl}
              directUrl={settings.directFaviconUrl}
              onChange={handleFaviconUpload}
              onRemove={() => setSettings({ ...settings, faviconUrl: null, directFaviconUrl: null })}
            />
            <p className="text-sm text-muted-foreground">
              Upload your site favicon. Recommended size: 32x32px or 16x16px. Max file size: 2MB.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onSave} disabled={isSaving} size="sm">
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
    </div>
  )
}
