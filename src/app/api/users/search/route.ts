/**
 * User Search API Route
 *
 * Allows admins to search for users by name or email
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'

/**
 * GET /api/users/search
 *
 * Search users by name or email (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const userSession = await getSession()
    if (!userSession) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to search users'
      }, { status: 401 })
    }

    // Only admins can search users
    if (userSession.role === 'USER') {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only admins can search users'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: { users: [] }
      })
    }

    // Search users by name or email
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } }
        ],
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true
      },
      take: 10
    })

    return NextResponse.json({
      success: true,
      data: { users }
    })

  } catch (error) {
    console.error('Search users error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to search users',
      message: 'An error occurred while searching'
    }, { status: 500 })
  }
}
