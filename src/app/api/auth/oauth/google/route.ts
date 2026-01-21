import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                   request.headers.get('host') ||
                   'http://localhost:3000'

    // Google OAuth configuration
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
    if (!clientId) {
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      )
    }

    // Generate state parameter for security
    const state = Buffer.from(
      JSON.stringify({
        random: Math.random().toString(36).substring(7),
        timestamp: Date.now()
      })
    ).toString('base64')

    // Construct Google OAuth URL
    const redirectUri = `${baseUrl}/api/auth/oauth/callback/google`
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ')

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('state', state)

    return NextResponse.json({ url: authUrl.toString() })
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth' },
      { status: 500 }
    )
  }
}
