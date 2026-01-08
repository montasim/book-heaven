/**
 * Prisma Client for Embeddings Database (separate pgvector database)
 * This client connects to the embeddings database stored at EMBEDDING_DATABASE_URL
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool, PoolConfig } from 'pg'
import { config } from '@/config'

const globalForEmbeddingsPrisma = globalThis as unknown as { embeddingsPrisma: PrismaClient }

const createEmbeddingsPrismaClient = () => {
  if (!config.embeddingDatabaseUrl) {
    throw new Error('EMBEDDING_DATABASE_URL is not set in environment variables')
  }

  // Create a connection pool for the embeddings database
  const poolConfig: PoolConfig = {
    connectionString: config.embeddingDatabaseUrl,
    // Separate connection pool settings for embeddings database
    max: 10, // Maximum number of connections
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  }

  const pool = new Pool(poolConfig)
  const adapter = new PrismaPg(pool)

  return new PrismaClient({ adapter })
}

export const embeddingsPrisma = globalForEmbeddingsPrisma.embeddingsPrisma || createEmbeddingsPrismaClient()

if (config.isDevelopment) globalForEmbeddingsPrisma.embeddingsPrisma = embeddingsPrisma

// Graceful shutdown for embeddings connection
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await embeddingsPrisma.$disconnect()
  })
}
