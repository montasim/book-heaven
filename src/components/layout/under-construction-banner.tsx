'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SiteSettings {
  underConstruction: boolean
  underConstructionMessage?: string | null
}

export function UnderConstructionBanner() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/public/site/settings', {
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          setSettings(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch site settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Don't render anything while loading or if under construction is off
  if (isLoading || !settings || !settings.underConstruction || !isVisible) {
    return null
  }

  return (
    <div className="border-b-2 border-amber-500/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-amber-900 dark:text-amber-100 font-medium">
            {settings.underConstructionMessage || 'Site is under construction. Some features may not work as expected.'}
          </p>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-2 text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
