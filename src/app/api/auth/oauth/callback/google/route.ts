import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'
import bcrypt from 'bcrypt'

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

// Helper function to create JWT tokens
async function createToken(payload: any, expiry: string) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(JWT_SECRET)
}

// Helper function to get user's IP address
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL('/auth/sign-in?error=oauth_cancelled', request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/auth/sign-in?error=no_code', request.url)
      )
    }

    // Parse state parameter to get redirect info
    let stateData: { redirect?: string | null; connect?: string | null } | null = null
    try {
      if (state) {
        stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      }
    } catch (e) {
      console.error('Failed to parse state:', e)
    }

    // Helper function to determine redirect URL
    const getRedirectUrl = (userRole: string) => {
      // If connecting an account from settings, redirect back with connected parameter
      if (stateData?.connect && stateData?.redirect) {
        return new URL(`${stateData.redirect}?connected=${stateData.connect}`, request.url)
      }
      // If a redirect URL was provided, use it
      if (stateData?.redirect) {
        return new URL(stateData.redirect, request.url)
      }
      // Default redirect based on user role
      return userRole === 'USER' ? new URL('/books', request.url) : new URL('/dashboard', request.url)
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/callback/google`,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for token')
      return NextResponse.redirect(
        new URL('/auth/sign-in?error=token_exchange_failed', request.url)
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get user info from Google
    const userResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    )

    if (!userResponse.ok) {
      console.error('Failed to fetch user info')
      return NextResponse.redirect(
        new URL('/auth/sign-in?error=user_info_failed', request.url)
      )
    }

    const googleUser = await userResponse.json()
    const googleId = googleUser.id
    const email = googleUser.email
    const name = googleUser.name
    const avatar = googleUser.picture

    if (!email) {
      return NextResponse.redirect(
        new URL('/auth/sign-in?error=no_email', request.url)
      )
    }

    // Check if social account exists by provider's unique ID
    const existingSocial = await prisma.socialAccount.findUnique({
      where: { providerAccountId: googleId },
      include: { user: true }
    })

    if (existingSocial) {
      // User exists, sign them in
      const user = existingSocial.user

      if (!user.isActive) {
        return NextResponse.redirect(
          new URL('/auth/sign-in?error=account_disabled', request.url)
        )
      }

      // Update last used timestamp
      await prisma.socialAccount.update({
        where: { id: existingSocial.id },
        data: {
          lastUsedAt: new Date(),
          accessToken,
          tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000)
        }
      })

      // Create tokens
      const accessTokenJwt = await createToken(
        { userId: user.id, email: user.email, role: user.role },
        ACCESS_TOKEN_EXPIRY
      )
      const refreshToken = await createToken(
        { userId: user.id },
        REFRESH_TOKEN_EXPIRY
      )

      // Store refresh token in database
      await prisma.userSession.create({
        data: {
          userId: user.id,
          token: refreshToken,
          tokenType: 'REFRESH',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') || undefined
        }
      })

      // Set cookies
      const response = NextResponse.redirect(getRedirectUrl(user.role))

      response.cookies.set('accessToken', accessTokenJwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
        path: '/'
      })

      response.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      })

      return response
    }

    // Check if user with same email exists (account linking)
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // Link the social account to existing user
      await prisma.socialAccount.create({
        data: {
          userId: existingUser.id,
          provider: 'GOOGLE',
          providerAccountId: googleId,
          providerEmail: email,
          accessToken,
          refreshToken: tokenData.refresh_token || null,
          tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          avatar,
          profileUrl: googleUser.link || null
        }
      })

      // Create tokens and sign in
      const accessTokenJwt = await createToken(
        { userId: existingUser.id, email: existingUser.email, role: existingUser.role },
        ACCESS_TOKEN_EXPIRY
      )
      const refreshTokenJwt = await createToken(
        { userId: existingUser.id },
        REFRESH_TOKEN_EXPIRY
      )

      // Store refresh token
      await prisma.userSession.create({
        data: {
          userId: existingUser.id,
          token: refreshTokenJwt,
          tokenType: 'REFRESH',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') || undefined
        }
      })

      const response = NextResponse.redirect(getRedirectUrl(existingUser.role))

      response.cookies.set('accessToken', accessTokenJwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60,
        path: '/'
      })

      response.cookies.set('refreshToken', refreshTokenJwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/'
      })

      return response
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || '',
        avatar,
        directAvatarUrl: avatar,
        passwordHash: '', // Empty password for OAuth-only users
        theme: 'light'
      }
    })

    // Create social account
    await prisma.socialAccount.create({
      data: {
        userId: newUser.id,
        provider: 'GOOGLE',
        providerAccountId: googleId,
        providerEmail: email,
        accessToken,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        avatar,
        profileUrl: googleUser.link || null
      }
    })

    // Create tokens
    const accessTokenJwt = await createToken(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      ACCESS_TOKEN_EXPIRY
    )
    const refreshTokenJwt = await createToken(
      { userId: newUser.id },
      REFRESH_TOKEN_EXPIRY
    )

    // Store refresh token
    await prisma.userSession.create({
      data: {
        userId: newUser.id,
        token: refreshTokenJwt,
        tokenType: 'REFRESH',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent') || undefined
      }
    })

    const response = NextResponse.redirect(getRedirectUrl(newUser.role))

    response.cookies.set('accessToken', accessTokenJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/'
    })

    response.cookies.set('refreshToken', refreshTokenJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/auth/sign-in?error=oauth_failed', request.url)
    )
  }
}
