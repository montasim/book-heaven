import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'
import { prisma } from '@/lib/prisma'

// GET /api/user/social-accounts - Get user's social accounts
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await findUserById(session.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const socialAccounts = await prisma.socialAccount.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ accounts: socialAccounts })
  } catch (error) {
    console.error('Failed to fetch social accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social accounts' },
      { status: 500 }
    )
  }
}
