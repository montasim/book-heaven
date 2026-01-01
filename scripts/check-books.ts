import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkBooks() {
  const [total, publicCount, featuredCount] = await Promise.all([
    prisma.book.count(),
    prisma.book.count({ where: { isPublic: true } }),
    prisma.book.count({ where: { isPublic: true, featured: true } }),
  ])

  console.log('Total books:', total)
  console.log('Public books:', publicCount)
  console.log('Featured books:', featuredCount)

  await prisma.$disconnect()
}

checkBooks().catch(console.error)
