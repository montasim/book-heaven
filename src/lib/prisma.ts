import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from '@/config'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  pool?: Pool
}

// 1️⃣ Create ONE pool globally
if (!globalForPrisma.pool) {
  globalForPrisma.pool = new Pool({
    connectionString: config.databaseUrl,
    max: 5,          // ✅ KEEP THIS LOW
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
}

// 2️⃣ Create ONE Prisma client
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    adapter: new PrismaPg(globalForPrisma.pool),
    log: config.isDevelopment ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma