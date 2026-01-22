import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from '@/config'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const createPrismaClient = () => {
  const pool = new Pool({
    connectionString: config.databaseUrl,
    max: 20, // Increased pool size for better concurrency
    min: 2, // Minimum number of clients to keep in pool
    idleTimeoutMillis: 60000, // Close idle clients after 60 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: config.isDevelopment ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (config.isDevelopment) {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown in development
if (config.isDevelopment && typeof window === 'undefined') {
  // Disconnect on process exit
  process.on('beforeExit', async () => {
    await globalForPrisma.prisma?.$disconnect()
  })
}

// In production, disconnect on SIGINT and SIGTERM
if (config.isProduction && typeof window === 'undefined') {
  process.on('SIGINT', async () => {
    await globalForPrisma.prisma?.$disconnect()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await globalForPrisma.prisma?.$disconnect()
    process.exit(0)
  })
}
