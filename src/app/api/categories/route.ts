/**
 * Categories API Route
 *
 * Provides list of all categories for filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/categories
 *
 * Get all categories
 */
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        // Add any filtering logic if needed
      },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: { categories }
    })

  } catch (error) {
    console.error('Get categories error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories',
      message: 'An error occurred while fetching categories'
    }, { status: 500 })
  }
}
