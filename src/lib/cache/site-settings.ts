/**
 * Site settings cache manager
 * Provides in-memory caching with Redis fallback for site-wide settings
 */

import { prisma } from '@/lib/prisma'

// In-memory cache
let settingsCache: any | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached site settings (server-side)
 * Returns settings from cache if valid, otherwise fetches from database
 */
export async function getSiteSettings() {
  const now = Date.now()

  // Return cache if valid
  if (settingsCache && (now - cacheTimestamp) < CACHE_TTL) {
    console.log('[Site Settings Cache] Cache hit, returning cached settings')
    return settingsCache
  }

  console.log('[Site Settings Cache] Cache miss or expired, fetching from database')

  // Fetch from database
  const settings = await prisma.systemSettings.findFirst()

  if (!settings) {
    // Create default settings if none exist
    console.log('[Site Settings Cache] No settings found, creating defaults')
    const newSettings = await prisma.systemSettings.create({
      data: {
        siteName: 'Book Heaven',
      },
    })
    settingsCache = newSettings
  } else {
    // Ensure siteName exists (for records created before the field was added)
    if (!settings.siteName) {
      console.log('[Site Settings Cache] siteName missing, updating...')
      const updated = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { siteName: 'Book Heaven' },
      })
      settingsCache = updated
    } else {
      settingsCache = settings
    }
  }

  cacheTimestamp = now

  // Also cache in Redis if available
  if (process.env.REDIS_HOST) {
    try {
      const { setCache } = await import('./redis')
      await setCache('site:settings:default', settingsCache, 300) // 5 minutes
      console.log('[Site Settings Cache] Cached in Redis')
    } catch (error) {
      console.error('[Site Settings Cache] Failed to cache in Redis:', error)
    }
  }

  return settingsCache
}

/**
 * Invalidate settings cache
 * Clears both in-memory cache and Redis cache
 */
export async function invalidateSiteSettingsCache(): Promise<void> {
  console.log('[Site Settings Cache] Invalidating cache')

  // Clear in-memory cache
  settingsCache = null
  cacheTimestamp = 0

  // Clear Redis cache if available
  if (process.env.REDIS_HOST) {
    try {
      const { deleteCache } = await import('./redis')
      await deleteCache('site:settings:*')
      console.log('[Site Settings Cache] Redis cache cleared')
    } catch (error) {
      console.error('[Site Settings Cache] Failed to clear Redis cache:', error)
    }
  }
}

/**
 * Get site name from settings
 */
export async function getSiteName(): Promise<string> {
  const settings = await getSiteSettings()
  return settings.siteName || 'Book Heaven'
}

/**
 * Get site slogan from settings
 */
export async function getSiteSlogan(): Promise<string> {
  const settings = await getSiteSettings()
  return settings.siteSlogan || ''
}
