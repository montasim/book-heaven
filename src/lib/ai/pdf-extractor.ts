/**
 * PDF Content Extraction Utility
 * Extracts text content from PDF files for AI processing
 */

export interface PdfPage {
  pageNumber: number;
  content: string;
}

export interface PdfContent {
  fullText: string;
  pages: PdfPage[];
}

/**
 * Extracts relevant content from PDF based on user query
 * Uses keyword matching to find most relevant pages
 *
 * @param pdfContent - Full PDF content or pages array
 * @param query - User's question/query
 * @param maxPages - Maximum number of pages to return (default: 10)
 * @returns Formatted string with relevant page content
 */
export function extractRelevantContent(
  pdfContent: string | PdfPage[],
  query: string,
  maxPages: number = 10
): string {
  // Convert string to pages array if needed
  let pages: PdfPage[] = [];

  if (typeof pdfContent === 'string') {
    // Try to split by form feed character (page separator)
    const pageContents = pdfContent.split(/\f/);
    pages = pageContents
      .map((content, index) => ({
        pageNumber: index + 1,
        content: content.trim()
      }))
      .filter(p => p.content.length > 0);
  } else {
    pages = pdfContent;
  }

  if (pages.length === 0) {
    return '[No content available]';
  }

  // Extract keywords from query for scoring
  const keywords = query
    .toLowerCase()
    .replace(/[?.,!;:"'']/g, ' ')
    .split(' ')
    .filter(w => w.length > 3) // Only meaningful words
    .slice(0, 10); // Limit to 10 keywords

  // Score pages by keyword matches
  const scoredPages = pages.map(page => {
    const pageLower = page.content.toLowerCase();
    let score = 0;

    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = pageLower.match(regex);
      if (matches) {
        score += matches.length;
      }
    });

    return { ...page, score };
  });

  // Sort by score (highest first) and take top N pages
  const topPages = scoredPages
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPages);

  // If no keyword matches, return first N pages
  const pagesToUse = topPages[0]?.score === 0
    ? pages.slice(0, Math.min(maxPages, pages.length))
    : topPages;

  // Format content for AI
  return pagesToUse
    .map((p) => `[Page ${p.pageNumber}]\n${p.content}`)
    .join('\n\n---\n\n');
}

/**
 * Formats content for AI context with metadata
 */
export function formatContentForAI(
  content: string,
  bookName: string,
  authors: string[],
  maxChars: number = 15000
): string {
  // Truncate if too long to fit in AI context window
  const truncatedContent = content.length > maxChars
    ? content.substring(0, maxChars) + '\n\n[Content truncated due to length...]'
    : content;

  return `**BOOK:** ${bookName}
**AUTHOR(S):** ${authors.join(', ')}

**BOOK CONTENT:**
${truncatedContent}`;
}
