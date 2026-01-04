'use server'

import { NextRequest, NextResponse } from 'next/server'
import { refreshTokens, validateRefreshToken } from '@/lib/auth/token.repository'
import { findUserById } from '@/lib/user/repositories/user.repository'
import { z } from 'zod'

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = refreshSchema.parse(body)

    // Get user agent and IP for security tracking
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined

    // Validate refresh token and get user ID
    const userId = await validateRefreshToken(validatedData.refreshToken)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    // Get user data
    const user = await findUserById(userId)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Refresh tokens (old token is revoked, new tokens are issued)
    const tokenPair = await refreshTokens(
      validatedData.refreshToken,
      userAgent,
      ipAddress
    )

    if (!tokenPair) {
      return NextResponse.json(
        { success: false, message: 'Failed to refresh tokens' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        accessToken: tokenPair.accessToken,
        accessTokenExpiresAt: tokenPair.accessTokenExpiresAt,
        refreshToken: tokenPair.refreshToken,
        refreshTokenExpiresAt: tokenPair.refreshTokenExpiresAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isPremium: user.isPremium,
          avatar: user.avatar,
        },
      },
    })
  } catch (error: any) {
    console.error('Refresh token error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to refresh token' },
      { status: 500 }
    )
  }
}
