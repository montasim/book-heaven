import { Book } from '@/hooks/use-book';

/**
 * Generates an intelligent pre-filled query about the book
 * based on its metadata (title, authors, categories)
 */
export async function generatePreFilledQuery(book: Book): Promise<string> {
  // Safely extract authors
  const authors = book.authors && Array.isArray(book.authors)
    ? book.authors.map((a: any) => a.name).join(' & ')
    : 'the author';

  // Safely extract categories
  const categories = book.categories && Array.isArray(book.categories)
    ? book.categories.map((c: any) => c.name).join(', ')
    : '';

  const hasSummary = book.summary && book.summary.length > 0;
  const categoriesText = categories ? `this ${categories} book` : 'this book';

  // Generate intelligent query based on book metadata
  const queryTemplates = hasSummary ? [
    `Can you give me an overview of "${book.name}" by ${authors}? What are the main themes and key concepts discussed in ${categoriesText}?`,
    `What are the most important takeaways and main ideas from "${book.name}" by ${authors}?`,
    `I'd like to understand "${book.name}" better. Can you explain the core arguments, key concepts, and main themes that ${authors} present in ${categoriesText}?`,
    `Summarize the essential concepts and insights from "${book.name}" by ${authors}. What makes this book significant?`
  ] : [
    `Can you provide an overview of "${book.name}" by ${authors}? What topics and themes are covered in this book?`,
    `What are the key concepts and main ideas presented by ${authors} in "${book.name}"?`,
    `Tell me about the most important takeaways and insights from "${book.name}" by ${authors}.`
  ];

  // Select template based on book metadata hash
  const hash = (book.name.length + authors.length + (book.authors?.length || 0)) % queryTemplates.length;

  return queryTemplates[hash];
}
