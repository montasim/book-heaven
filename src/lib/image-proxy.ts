/**
 * Checks if a URL is a Google Drive URL
 */
export function isGoogleDriveUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const lowerUrl = url.toLowerCase()
  return lowerUrl.includes('drive.google.com') || lowerUrl.includes('docs.google.com')
}

/**
 * Converts a Google Drive image URL to a proxied URL
 * If the URL is not a Google Drive URL, returns it as-is
 */
export function getProxiedImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined

  // Only proxy Google Drive URLs
  if (isGoogleDriveUrl(url)) {
    return `/api/proxy/image?url=${encodeURIComponent(url)}`
  }

  return url
}
