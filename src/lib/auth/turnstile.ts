/**
 * Cloudflare Turnstile Verification
 *
 * Server-side verification for Turnstile tokens
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

interface VerifyTurnstileResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  'error-codes'?: string[]
}

/**
 * Verify a Turnstile token on the server side
 *
 * @param token - The Turnstile token from the client
 * @param remoteIp - Optional: The user's IP address for additional verification
 * @returns true if verification succeeds, false otherwise
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY is not configured')
    // In development, you might want to allow requests without verification
    if (process.env.NODE_ENV === 'development') {
      console.warn('Development mode: Skipping Turnstile verification')
      return true
    }
    return false
  }

  if (!token) {
    console.error('Turnstile token is missing')
    return false
  }

  try {
    const verificationUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

    const body = new URLSearchParams({
      secret: secretKey,
      response: token,
    })

    // Add remoteip if provided
    if (remoteIp) {
      body.append('remoteip', remoteIp)
    }

    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const result: VerifyTurnstileResponse = await response.json()

    if (!result.success) {
      console.error('Turnstile verification failed:', result['error-codes'])
      return false
    }

    return true
  } catch (error) {
    console.error('Error verifying Turnstile token:', error)
    return false
  }
}

/**
 * Extract and validate Turnstile token from request body
 *
 * @param body - Request body that may contain turnstileToken
 * @param remoteIp - Optional: The user's IP address
 * @returns Error message if verification fails, null if successful
 */
export async function validateTurnstileFromRequest(
  body: { turnstileToken?: string },
  remoteIp?: string
): Promise<string | null> {
  const { turnstileToken } = body

  // Skip verification in development if not configured
  if (!process.env.TURNSTILE_SECRET_KEY && process.env.NODE_ENV === 'development') {
    console.warn('Development mode: Turnstile not configured, skipping verification')
    return null
  }

  if (!turnstileToken) {
    return 'CAPTCHA verification is required'
  }

  const isValid = await verifyTurnstileToken(turnstileToken, remoteIp)

  if (!isValid) {
    return 'CAPTCHA verification failed'
  }

  return null
}
