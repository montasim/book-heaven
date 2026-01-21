import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

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

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID || process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/callback/github`
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

    if (!accessToken) {
      console.error('No access token in response', tokenData)
      return NextResponse.redirect(
        new URL('/auth/sign-in?error=no_access_token', request.url)
      )
    }

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Book-Heaven'
      }
    })

    if (!userResponse.ok) {
      console.error('Failed to fetch user info')
      return NextResponse.redirect(
        new URL('/auth/sign-in?error=user_info_failed', request.url)
      )
    }

    const githubUser = await userResponse.json()
    const githubId = String(githubUser.id)
    const githubLogin = githubUser.login
    const name = githubUser.name || githubUser.login
    const avatar = githubUser.avatar_url
    const profileUrl = githubUser.html_url

    // Get user email (GitHub requires separate API call for email)
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Book-Heaven'
      }
    })

    let email = null
    if (emailResponse.ok) {
      const emails = await emailResponse.json()
      const primaryEmail = emails.find((e: any) => e.primary)
      email = primaryEmail?.email
    }

    if (!email) {
      return NextResponse.redirect(
        new URL('/auth/sign-in?error=no_public_email', request.url)
      )
    }

    // Check if social account exists
    const existingSocial = await prisma.socialAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'GITHUB',
          providerAccountId: githubId
        }
      },
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
          accessToken
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
      const response = NextResponse.redirect(
        user.role === 'USER' ? new URL('/books', request.url) :
                               new URL('/dashboard', request.url)
      )

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
          provider: 'GITHUB',
          providerAccountId: githubId,
          providerEmail: email,
          accessToken,
          avatar,
          profileUrl
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

      const response = NextResponse.redirect(
        existingUser.role === 'USER' ? new URL('/books', request.url) :
                                        new URL('/dashboard', request.url)
      )

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
        name: name || githubLogin,
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
        provider: 'GITHUB',
        providerAccountId: githubId,
        providerEmail: email,
        accessToken,
        avatar,
        profileUrl
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

    const response = NextResponse.redirect(new URL('/books', request.url))

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
    console.error('GitHub OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/auth/sign-in?error=oauth_failed', request.url)
    )
  }
}
