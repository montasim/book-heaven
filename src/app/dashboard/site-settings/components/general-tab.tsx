'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Construction } from 'lucide-react'
import { Loader2, Save } from 'lucide-react'

interface GeneralTabProps {
  settings: any
  setSettings: (settings: any) => void
  underConstructionMessage: string
  setUnderConstructionMessage: (message: string) => void
  isSaving: boolean
  onSave: () => void
}

export function GeneralTab({
  settings,
  setSettings,
  underConstructionMessage,
  setUnderConstructionMessage,
  isSaving,
  onSave,
}: GeneralTabProps) {
  return (
    <div className="space-y-6">
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
  )
}
