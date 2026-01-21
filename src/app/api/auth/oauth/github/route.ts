import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                   request.headers.get('host') ||
                   'http://localhost:3000'

    // GitHub OAuth configuration
    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID || process.env.GITHUB_CLIENT_ID
    if (!clientId) {
      return NextResponse.json(
        { error: 'GitHub OAuth not configured' },
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

    // Construct GitHub OAuth URL
    const redirectUri = `${baseUrl}/api/auth/oauth/callback/github`

    const authUrl = new URL('https://github.com/login/oauth/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', 'read:user user:email')
    authUrl.searchParams.set('state', state)

    return NextResponse.json({ url: authUrl.toString() })
  } catch (error) {
    console.error('GitHub OAuth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate GitHub OAuth' },
      { status: 500 }
    )
  }
}
