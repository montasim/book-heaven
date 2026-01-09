import { embeddingsPrisma } from '@/lib/prisma-embeddings'

/**
 * Get total number of chunks for a book (across all versions)
 * @param bookId - Book ID
 */
export async function getBookChunkCount(bookId: string): Promise<number> {
  const result = await embeddingsPrisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM "book_embeddings"
    WHERE "bookId" = ${bookId}
  `
  return Number(result[0]?.count || 0)
}

/**
 * Search for similar chunks using vector similarity (pgvector)
 * Uses the separate embeddings database (EMBEDDING_DATABASE_URL)
 * @param bookId - Book ID to search within
 * @param queryEmbedding - Query vector embedding (768 dimensions)
 * @param limit - Maximum number of results to return
 * @param minSimilarity - Minimum similarity threshold (0-1), filters out less relevant chunks
 * @param version - Embedding version to search (defaults to latest)
 */
export async function searchSimilarChunks(
  bookId: string,
  queryEmbedding: number[],
  limit: number = 5,
  minSimilarity: number = 0.0,
  version?: number
): Promise<Array<{ chunkIndex: number; chunkText: string; pageNumber: number | null; similarity: number }>> {
  const vectorStr = `[${queryEmbedding.join(',')}]`

  // If version not specified, get the latest version for this book
  let targetVersion = version
  if (targetVersion === undefined) {
    const latestEmbedding = await embeddingsPrisma.$queryRaw<Array<{ version: number }>>`
      SELECT "version"
      FROM "book_embeddings"
      WHERE "bookId" = ${bookId}
      ORDER BY "version" DESC
      LIMIT 1
    `
    targetVersion = latestEmbedding[0]?.version || 1
  }

  // Search using cosine similarity (pgvector <=> operator is cosine distance)
  // We convert distance to similarity: similarity = 1 - distance
  // Filter by minimum similarity to exclude irrelevant results
  const results = await embeddingsPrisma.$queryRaw<Array<{ chunkIndex: number; chunkText: string | null; pageNumber: number | null; similarity: number }>>`
    SELECT
      "chunkIndex",
      "chunkText",
      "pageNumber",
      1 - ("embedding" <=> ${vectorStr}::vector(768)) as similarity
    FROM "book_embeddings"
    WHERE "bookId" = ${bookId}
      AND "version" = ${targetVersion}
      AND (1 - ("embedding" <=> ${vectorStr}::vector(768))) >= ${minSimilarity}
    ORDER BY "embedding" <=> ${vectorStr}::vector(768)
    LIMIT ${limit}
  `

  return results.map(r => ({
    chunkIndex: r.chunkIndex,
    chunkText: r.chunkText || '',
    pageNumber: r.pageNumber,
    similarity: r.similarity,
  }))
}

/**
 * Get all embeddings for a book (defaults to latest version)
 * @param bookId - Book ID
 * @param version - Embedding version (defaults to latest)
 */
export async function getBookEmbeddings(
  bookId: string,
  version?: number
): Promise<Array<{ chunkIndex: number; chunkText: string; pageNumber: number | null; wordCount: number | null }>> {
  // If version not specified, get the latest version
  let targetVersion = version
  if (targetVersion === undefined) {
    const latestVersion = await embeddingsPrisma.$queryRaw<Array<{ version: number }>>`
      SELECT MAX("version") as version
      FROM "book_embeddings"
      WHERE "bookId" = ${bookId}
    `
    targetVersion = latestVersion[0]?.version || 1
  }

  // Need to use raw query since embedding field is marked as Unsupported in Prisma schema
  const embeddings = await embeddingsPrisma.$queryRaw<Array<{
    chunkIndex: number
    chunkText: string | null
    pageNumber: number | null
    wordCount: number | null
  }>>`
    SELECT "chunkIndex", "chunkText", "pageNumber", "wordCount"
    FROM "book_embeddings"
    WHERE "bookId" = ${bookId} AND "version" = ${targetVersion}
    ORDER BY "chunkIndex" ASC
  `

  return embeddings.map(e => ({
    chunkIndex: e.chunkIndex,
    chunkText: e.chunkText || '',
    pageNumber: e.pageNumber,
    wordCount: e.wordCount,
  }))
}

/**
 * Check if embeddings exist for a book
 */
export async function hasBookEmbeddings(bookId: string): Promise<boolean> {
  const result = await embeddingsPrisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM "book_embeddings"
    WHERE "bookId" = ${bookId}
  `
  return (Number(result[0]?.count) || 0) > 0
}

/**
 * Get the latest embedding version for a book
 */
export async function getLatestEmbeddingVersion(bookId: string): Promise<number> {
  const result = await embeddingsPrisma.$queryRaw<Array<{ version: number }>>`
    SELECT "version"
    FROM "book_embeddings"
    WHERE "bookId" = ${bookId}
    ORDER BY "version" DESC
    LIMIT 1
  `
  return result[0]?.version || 1
}
