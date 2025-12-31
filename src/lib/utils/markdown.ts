/**
 * Markdown Utility Functions
 *
 * These functions are safe to use in both client and server components
 * They don't initialize any email service clients
 */

import { marked } from 'marked'

/**
 * Convert Markdown to HTML
 * Uses the marked library for conversion
 */
export function markdownToHtml(markdown: string): string {
  // Configure marked options for safe HTML
  marked.setOptions({
    breaks: true, // Convert \n to <br>
    gfm: true, // Enable GitHub Flavored Markdown
  })

  return marked(markdown) as string
}

/**
 * Generate unsubscribe URL for a campaign
 * This is a utility function that doesn't require email service
 */
export function generateUnsubscribeUrl(campaignId: string, userId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/api/campaigns/unsubscribe?campaign=${campaignId}&user=${userId}`
}
