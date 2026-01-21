import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'
import { prisma } from '@/lib/prisma'

// DELETE /api/user/social-accounts/[provider] - Revoke a social account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { provider } = await params
    const providerUpper = provider.toUpperCase() as 'GOOGLE' | 'GITHUB'

    // Get full user record
    const user = await findUserById(session.userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if this is the only authentication method
    const hasPassword = user.passwordHash && user.passwordHash.length > 0
    const socialAccountCount = await prisma.socialAccount.count({
      where: {
        userId: user.id,
        isActive: true
      }
    })

    if (!hasPassword && socialAccountCount === 1) {
      return NextResponse.json(
        { error: 'Cannot remove your only sign-in method. Please set a password first.' },
        { status: 400 }
      )
    }

    // Delete the social account
    await prisma.socialAccount.delete({
      where: {
        userId_provider: {
          userId: user.id,
          provider: providerUpper
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `${provider} account removed successfully`
    })
  } catch (error) {
    console.error('Failed to revoke social account:', error)
    return NextResponse.json(
      { error: 'Failed to revoke social account' },
      { status: 500 }
    )
  }
}
