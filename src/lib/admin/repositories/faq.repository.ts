import { prisma } from '@/lib/prisma'
import { FAQ } from '@prisma/client'

/**
 * Get all active FAQs
 */
export async function getActiveFAQs(): Promise<FAQ[]> {
  return await prisma.fAQ.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })
}

/**
 * Get all FAQs (including inactive)
 */
export async function getAllFAQs(): Promise<FAQ[]> {
  return await prisma.fAQ.findMany({
    orderBy: { order: 'asc' },
  })
}

/**
 * Get a FAQ by ID
 */
export async function getFAQById(id: string): Promise<FAQ | null> {
  return await prisma.fAQ.findUnique({
    where: { id },
  })
}

/**
 * Create a new FAQ
 */
export async function createFAQ(data: {
  question: string
  answer: string
  category: string
  isActive: boolean
  order: number
}): Promise<FAQ> {
  return await prisma.fAQ.create({
    data,
  })
}

/**
 * Update an existing FAQ
 */
export async function updateFAQ(
  id: string,
  data: {
    question?: string
    answer?: string
    category?: string
    isActive?: boolean
    order?: number
  }
): Promise<FAQ> {
  return await prisma.fAQ.update({
    where: { id },
    data,
  })
}

/**
 * Delete a FAQ
 */
export async function deleteFAQ(id: string): Promise<void> {
  await prisma.fAQ.delete({
    where: { id },
  })
}

/**
 * Reorder FAQs
 */
export async function reorderFAQs(orderUpdates: { id: string; order: number }[]): Promise<void> {
  await Promise.all(
    orderUpdates.map(({ id, order }) =>
      prisma.fAQ.update({
        where: { id },
        data: { order },
      })
    )
  )
}

/**
 * Bulk upsert FAQs
 */
export async function bulkUpsertFAQs(
  faqs: Array<{ id?: string; question: string; answer: string; category: string; isActive: boolean; order: number }>
): Promise<FAQ[]> {
  const results: FAQ[] = []

  for (const faq of faqs) {
    if (faq.id) {
      // Update existing FAQ
      const updated = await prisma.fAQ.update({
        where: { id: faq.id },
        data: {
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          isActive: faq.isActive,
          order: faq.order,
        },
      })
      results.push(updated)
    } else {
      // Create new FAQ
      const created = await prisma.fAQ.create({
        data: {
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          isActive: faq.isActive,
          order: faq.order,
        },
      })
      results.push(created)
    }
  }

  return results
}
