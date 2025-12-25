import { downloadAndExtractPdf } from './pdf-downloader';
import { createHash } from 'crypto';

export interface ExtractedBookContent {
  text: string;
  numPages: number;
  wordCount: number;
  hash: string;
  size: number;
}

/**
 * Extract book content from PDF
 * Downloads the PDF and extracts all text content
 */
export async function extractBookContent(book: {
  fileUrl: string;
  directFileUrl?: string | null;
}): Promise<ExtractedBookContent> {
  console.log('[ContentExtractor] Starting content extraction...');

  // Download and extract PDF
  const pdfData = await downloadAndExtractPdf(
    book.fileUrl,
    book.directFileUrl
  );

  // Calculate MD5 hash for change detection
  const hash = createHash('md5').update(pdfData.text).digest('hex');

  // Count words
  const wordCount = pdfData.text.split(/\s+/).filter(w => w.length > 0).length;

  console.log(`[ContentExtractor] Extraction complete:`);
  console.log(`  - Words: ${wordCount}`);
  console.log(`  - Pages: ${pdfData.numPages}`);
  console.log(`  - Size: ${pdfData.text.length} bytes`);
  console.log(`  - Hash: ${hash.substring(0, 16)}...`);

  return {
    text: pdfData.text,
    numPages: pdfData.numPages,
    wordCount,
    hash,
    size: pdfData.text.length
  };
}

/**
 * Check if content needs to be re-extracted
 */
export function shouldReextractContent(book: {
  extractedContent?: string | null;
  contentHash?: string | null;
}): boolean {
  // No content exists
  if (!book.extractedContent || !book.contentHash) {
    return true;
  }

  // Content exists and is valid
  return false;
}
