/**
 * Token Repository
 *
 * Manages access and refresh tokens for secure authentication
 * - Access tokens: Short-lived (15 minutes)
 * - Refresh tokens: Long-lived (7 days)
 */

import { prisma } from '@/lib/prisma'
import { TokenType } from '@prisma/client'
import { randomBytes, createHash } from 'crypto'

// ============================================================================
// TOKEN CONFIGURATION
// ============================================================================

const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000 // 15 minutes in milliseconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Hash a token for storage (we store the hash, not the raw token)
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// ============================================================================
// TOKEN CREATION
// ============================================================================

/**
 * Create an access token for a user
 */
export async function createAccessToken(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY)

  await prisma.userSession.create({
    data: {
      userId,
      token: tokenHash,
      tokenType: TokenType.ACCESS,
      expiresAt,
      userAgent,
      ipAddress,
    },
  })

  return { token, expiresAt }
}

/**
 * Create a refresh token for a user
 */
export async function createRefreshToken(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY)

  await prisma.userSession.create({
    data: {
      userId,
      token: tokenHash,
      tokenType: TokenType.REFRESH,
      expiresAt,
      userAgent,
      ipAddress,
    },
  })

  return { token, expiresAt }
}

/**
 * Create both access and refresh tokens (for login)
 */
export async function createTokenPair(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{
  accessToken: string
  accessTokenExpiresAt: Date
  refreshToken: string
  refreshTokenExpiresAt: Date
}> {
  const [accessTokenData, refreshTokenData] = await Promise.all([
    createAccessToken(userId, userAgent, ipAddress),
    createRefreshToken(userId, userAgent, ipAddress),
  ])

  return {
    accessToken: accessTokenData.token,
    accessTokenExpiresAt: accessTokenData.expiresAt,
    refreshToken: refreshTokenData.token,
    refreshTokenExpiresAt: refreshTokenData.expiresAt,
  }
}

// ============================================================================
// TOKEN VALIDATION
// ============================================================================

/**
 * Validate an access token and return the user ID
 */
export async function validateAccessToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token)

  const session = await prisma.userSession.findUnique({
    where: { token: tokenHash },
    select: { userId: true, expiresAt: true, revokedAt: true, tokenType: true },
  })

  if (!session || session.tokenType !== TokenType.ACCESS) {
    return null
  }

  if (session.revokedAt || new Date() > session.expiresAt) {
    // Token expired or revoked, delete it
    await prisma.userSession.delete({ where: { token: tokenHash } }).catch(() => {})
    return null
  }

  return session.userId
}

/**
 * Validate a refresh token and return the user ID
 */
export async function validateRefreshToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token)

  const session = await prisma.userSession.findUnique({
    where: { token: tokenHash },
    select: { userId: true, expiresAt: true, revokedAt: true, tokenType: true },
  })

  if (!session || session.tokenType !== TokenType.REFRESH) {
    return null
  }

  if (session.revokedAt || new Date() > session.expiresAt) {
    // Token expired or revoked, delete it
    await prisma.userSession.delete({ where: { token: tokenHash } }).catch(() => {})
    return null
  }

  return session.userId
}

/**
 * Refresh tokens - validate refresh token and issue new token pair
 */
export async function refreshTokens(
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{
  accessToken: string
  accessTokenExpiresAt: Date
  refreshToken: string
  refreshTokenExpiresAt: Date
} | null> {
  const userId = await validateRefreshToken(refreshToken)

  if (!userId) {
    return null
  }

  // Revoke old refresh token
  await revokeToken(refreshToken)

  // Create new token pair
  return await createTokenPair(userId, userAgent, ipAddress)
}

// ============================================================================
// TOKEN REVOCATION
// ============================================================================

/**
 * Revoke a specific token
 */
export async function revokeToken(token: string): Promise<boolean> {
  const tokenHash = hashToken(token)

  try {
    await prisma.userSession.update({
      where: { token: tokenHash },
      data: { revokedAt: new Date() },
    })
    return true
  } catch {
    return false
  }
}

/**
 * Revoke all tokens for a user (logout from all devices)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { userId },
    data: { revokedAt: new Date() },
  })
}

/**
 * Revoke all refresh tokens for a user (force re-login)
 */
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { userId, tokenType: TokenType.REFRESH },
    data: { revokedAt: new Date() },
  })
}

// ============================================================================
// TOKEN CLEANUP
// ============================================================================

/**
 * Clean up expired tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.userSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })

  return result.count
}

/**
 * Clean up revoked tokens (should be run periodically)
 */
export async function cleanupRevokedTokens(): Promise<number> {
  const result = await prisma.userSession.deleteMany({
    where: {
      revokedAt: { not: null },
    },
  })

  return result.count
}
