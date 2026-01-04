'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'

interface SEOTabProps {
  settings: any
  setSettings: (settings: any) => void
  isSaving: boolean
  onSave: () => void
}

export function SEOTab({ settings, setSettings, isSaving, onSave }: SEOTabProps) {
  const handleOGImageUpload = async (file: File | null) => {
    if (!file) return
    // TODO: Implement Google Drive upload
    console.log('OG Image upload:', file)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SEO Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SEO Title */}
          <div className="space-y-2">
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              value={settings.seoTitle || 'Book Heaven - AI-Powered Digital Library'}
              onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
              placeholder="Book Heaven - AI-Powered Digital Library"
              maxLength={60}
            />
            <p className="text-sm text-muted-foreground">
              The default title for search engines (max 60 characters). Current: {(settings.seoTitle || 'Book Heaven - AI-Powered Digital Library').length}/60
            </p>
          </div>

          {/* SEO Description */}
          <div className="space-y-2">
            <Label htmlFor="seoDescription">Meta Description</Label>
            <Textarea
              id="seoDescription"
              value={settings.seoDescription || ''}
              onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
              placeholder="Discover, read, and interact with books using AI-powered features..."
              rows={3}
              maxLength={160}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              A brief description for search engines (max 160 characters). Current: {(settings.seoDescription || '').length}/160
            </p>
          </div>

          {/* SEO Keywords */}
          <div className="space-y-2">
            <Label htmlFor="seoKeywords">Keywords</Label>
            <Textarea
              id="seoKeywords"
              value={settings.seoKeywords || ''}
              onChange={(e) => setSettings({ ...settings, seoKeywords: e.target.value })}
              placeholder="digital library, AI chat, ebooks, audiobooks, reading, book recommendations"
              rows={2}
              maxLength={255}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Comma-separated keywords for SEO (max 255 characters)
            </p>
          </div>

          {/* OG Image */}
          <div className="space-y-2">
            <Label>Open Graph Image</Label>
            <ImageUpload
              value={settings.ogImage}
              directUrl={settings.directOgImageUrl}
              onChange={handleOGImageUpload}
              onRemove={() => setSettings({ ...settings, ogImage: null, directOgImageUrl: null })}
            />
            <p className="text-sm text-muted-foreground">
              Image displayed when your site is shared on social media. Recommended size: 1200x630px.
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
