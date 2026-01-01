/**
 * Mark recent public books as featured
 * Run with: npx tsx scripts/mark-featured.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function markFeatured() {
  try {
    // Check current counts
    const [total, publicCount, featuredCount] = await Promise.all([
      prisma.book.count(),
      prisma.book.count({ where: { isPublic: true } }),
      prisma.book.count({ where: { isPublic: true, featured: true } }),
    ])

    console.log('Current state:')
    console.log('  Total books:', total)
    console.log('  Public books:', publicCount)
    console.log('  Featured books:', featuredCount)

    if (publicCount === 0) {
      console.log('\n❌ No public books found. Please mark some books as public first.')
      return
    }

    // Get books to feature (not already featured, public)
    const booksToFeature = await prisma.book.findMany({
      where: {
        isPublic: true,
        featured: false,
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true },
    })

    if (booksToFeature.length === 0) {
      console.log('\n✓ All public books are already featured!')
      return
    }

    // Mark them as featured
    const bookIds = booksToFeature.map(b => b.id)
    await prisma.book.updateMany({
      where: { id: { in: bookIds } },
      data: { featured: true },
    })

    console.log('\n✓ Marked', booksToFeature.length, 'books as featured:')
    booksToFeature.forEach(book => {
      console.log('  -', book.name)
    })

    // Show new count
    const newFeaturedCount = await prisma.book.count({
      where: { isPublic: true, featured: true },
    })
    console.log('\nNew featured book count:', newFeaturedCount)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
    pool.end()
  }
}

markFeatured()
