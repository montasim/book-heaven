// /**
//  * Prisma Client Singleton
//  * 
//  * Following Dependency Inversion Principle (DIP):
//  * This module provides a singleton instance of Prisma Client
//  * to prevent multiple instances and connection pool exhaustion
//  * 
//  * In production: Creates a single instance
//  * In development: Uses globalThis to prevent hot reload issues
//  */

// import { PrismaClient } from '@prisma/client'

// // Extend globalThis to include prisma property
// declare global {
//     // eslint-disable-next-line no-var
//     var prisma: PrismaClient | undefined
// }

// // Create Prisma Client
// const createPrismaClient = () => {
//     return new PrismaClient({
//         log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
//     })
// }

// // Singleton instance
// export const prisma = globalThis.prisma || createPrismaClient()

// // In development, attach to globalThis to prevent multiple instances during hot reload
// if (process.env.NODE_ENV !== 'production') {
//     globalThis.prisma = prisma
// }

// // Graceful shutdown
// if (typeof window === 'undefined') {
//     process.on('beforeExit', async () => {
//         await prisma.$disconnect()
//     })
// }

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
        idleTimeoutMillis: 60000, // Close idle clients after 60 seconds (increased)
        connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
        // Connection eviction - remove idle connections after timeout
        idle_in_transaction_session_timeout: 60, // Close idle transactions after 60 seconds
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
