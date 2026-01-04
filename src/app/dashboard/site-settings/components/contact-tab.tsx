'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Mail, Twitter, Github, Facebook, Instagram, Linkedin, Save, Loader2 } from 'lucide-react'

interface ContactTabProps {
  settings: any
  setSettings: (settings: any) => void
  isSaving: boolean
  onSave: () => void
}

export function ContactTab({ settings, setSettings, isSaving, onSave }: ContactTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Support Email */}
          <div className="space-y-2">
            <Label htmlFor="supportEmail">
              <Mail className="h-4 w-4 inline mr-2" />
              Support Email
            </Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail || ''}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              placeholder="support@bookheaven.com"
            />
            <p className="text-sm text-muted-foreground">
              Email address for user support inquiries
            </p>
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail">
              <Mail className="h-4 w-4 inline mr-2" />
              General Contact Email
            </Label>
            <Input
              id="contactEmail"
              type="email"
              value={settings.contactEmail || ''}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              placeholder="contact@bookheaven.com"
            />
            <p className="text-sm text-muted-foreground">
              General contact email for business inquiries
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Twitter */}
          <div className="space-y-2">
            <Label htmlFor="socialTwitter">
              <Twitter className="h-4 w-4 inline mr-2" />
              Twitter / X
            </Label>
            <Input
              id="socialTwitter"
              type="url"
              value={settings.socialTwitter || ''}
              onChange={(e) => setSettings({ ...settings, socialTwitter: e.target.value })}
              placeholder="https://twitter.com/yourhandle"
            />
          </div>

          {/* GitHub */}
          <div className="space-y-2">
            <Label htmlFor="socialGithub">
              <Github className="h-4 w-4 inline mr-2" />
              GitHub
            </Label>
            <Input
              id="socialGithub"
              type="url"
              value={settings.socialGithub || ''}
              onChange={(e) => setSettings({ ...settings, socialGithub: e.target.value })}
              placeholder="https://github.com/yourorganization"
            />
          </div>

          {/* Facebook */}
          <div className="space-y-2">
            <Label htmlFor="socialFacebook">
              <Facebook className="h-4 w-4 inline mr-2" />
              Facebook
            </Label>
            <Input
              id="socialFacebook"
              type="url"
              value={settings.socialFacebook || ''}
              onChange={(e) => setSettings({ ...settings, socialFacebook: e.target.value })}
              placeholder="https://facebook.com/yourpage"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="socialInstagram">
              <Instagram className="h-4 w-4 inline mr-2" />
              Instagram
            </Label>
            <Input
              id="socialInstagram"
              type="url"
              value={settings.socialInstagram || ''}
              onChange={(e) => setSettings({ ...settings, socialInstagram: e.target.value })}
              placeholder="https://instagram.com/yourhandle"
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <Label htmlFor="socialLinkedIn">
              <Linkedin className="h-4 w-4 inline mr-2" />
              LinkedIn
            </Label>
            <Input
              id="socialLinkedIn"
              type="url"
              value={settings.socialLinkedIn || ''}
              onChange={(e) => setSettings({ ...settings, socialLinkedIn: e.target.value })}
              placeholder="https://linkedin.com/company/yourcompany"
            />
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
