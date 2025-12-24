/**
 * Calculate estimated reading time based on page count
 * @param pageCount - Number of pages
 * @param minutesPerPage - Average reading speed (default: 2 minutes per page)
 * @returns Formatted string (e.g., "30 min read", "2h 15m read") or null if invalid
 */
export function calculateReadingTime(
  pageCount?: number | null,
  minutesPerPage: number = 2
): string | null {
  if (!pageCount || pageCount <= 0) return null

  const totalMinutes = pageCount * minutesPerPage

  if (totalMinutes < 60) {
    return `${totalMinutes} min read`
  }

  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m read`
    : `${hours}h read`
}

/**
 * Calculate reading time in hours from total pages
 * @param totalPages - Total number of pages
 * @param minutesPerPage - Average reading speed (default: 2 minutes per page)
 * @returns Reading time in hours (rounded)
 */
export function calculateReadingTimeHours(
  totalPages: number,
  minutesPerPage: number = 2
): number {
  return Math.round((totalPages * minutesPerPage) / 60)
}
