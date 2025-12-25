import { NextRequest, NextResponse } from 'next/server'
import { getCategoryWithCompleteDetails } from '@/lib/lms/repositories/category.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/categories/[id]/details
 * Get comprehensive category data for admin dashboard
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const categoryId = params.id

    // Check authentication and admin role
    const session = await getSession()
    const user = session ? await findUserById(session.userId) : null
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get category with complete details
    const category = await getCategoryWithCompleteDetails(categoryId)

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: category,
    })
  } catch (error) {
    console.error('Error fetching admin category details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category details' },
      { status: 500 }
    )
  }
}
