/**
 * User Session Management Module
 *
 * Following Single Responsibility Principle (SRP):
 * This module handles user session creation, validation, and deletion
 * using database-stored sessions for security and scalability
 *
 * Features:
 * - Database-stored sessions for scalability
 * - Secure session token generation
 * - Session expiry management
 * - Type-safe session data
 * - Session cleanup utilities
 */

import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { UserSessionData, UserSessionExpiredError } from './types'
import { createUserSession, deleteUserSession, findUserBySessionToken } from '../repositories/user.repository'

// ============================================================================
// SESSION CONFIGURATION
// ============================================================================

const SESSION_COOKIE_NAME = 'user_session'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds
const SESSION_TOKEN_LENGTH = 64 // Length of session token in hex characters

// ============================================================================
// SESSION TOKEN GENERATION
// ============================================================================

/**
 * Generate a secure random session token
 *
 * @returns {string} Secure random session token
 */
export function generateSessionToken(): string {
    return randomBytes(SESSION_TOKEN_LENGTH / 2).toString('hex')
}

/**
 * Create session expiration date
 *
 * @param {number} [maxAge] - Custom max age in seconds (default: 30 days)
 * @returns {Date} Expiration date
 */
export function createSessionExpiration(maxAge: number = SESSION_MAX_AGE): Date {
    return new Date(Date.now() + maxAge * 1000)
}

// ============================================================================
// SESSION CREATION
// ============================================================================

/**
 * Create a user login session and set HttpOnly cookie
 *
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {boolean} isPremium - Premium status
 *
 * Security: Uses HttpOnly, Secure (in production), SameSite=Lax
 * Session is stored in database for scalability and security
 */
export async function createUserLoginSession(
    userId: string,
    email: string,
    name: string,
    isPremium: boolean
): Promise<string> {
    const sessionToken = generateSessionToken()
    const expiresAt = createSessionExpiration()

    // Store session in database
    await createUserSession({
        userId,
        token: sessionToken,
        expiresAt,
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
    })

    return sessionToken
}

// ============================================================================
// SESSION RETRIEVAL
// ============================================================================

/**
 * Get current user session from cookie and database
 *
 * @returns {Promise<UserSessionData | null>} Session data or null if not found
 */
export async function getUserSession(): Promise<UserSessionData | null> {
    try {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

        if (!sessionCookie || !sessionCookie.value) {
            return null
        }

        const sessionToken = sessionCookie.value

        // Find user by session token in database
        const user = await findUserBySessionToken(sessionToken)

        if (!user) {
            // Invalid session token, clean up cookie
            cookieStore.delete(SESSION_COOKIE_NAME)
            return null
        }

        // Validate session data structure
        if (!user.id || !user.email || !user.name) {
            return null
        }

        return {
            userId: user.id,
            email: user.email,
            name: user.name,
            isPremium: user.isPremium,
            sessionId: sessionToken,
        }
    } catch (error) {
        console.error('Error getting user session:', error)
        return null
    }
}

/**
 * Require authenticated user session (throws if not authenticated)
 *
 * @returns {Promise<UserSessionData>} Session data
 * @throws {UserSessionExpiredError} If session not found
 */
export async function requireUserAuth(): Promise<UserSessionData> {
    const session = await getUserSession()

    if (!session) {
        throw new UserSessionExpiredError('Authentication required. Please login.')
    }

    return session
}

/**
 * Get user ID from session (convenience function)
 *
 * @returns {Promise<string | null>} User ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
    const session = await getUserSession()
    return session?.userId || null
}

// ============================================================================
// SESSION DELETION
// ============================================================================

/**
 * Delete user session (logout)
 *
 * @param {string} [sessionToken] - Optional session token to delete
 *                                  If not provided, uses current session cookie
 */
export async function deleteUserLoginSession(sessionToken?: string): Promise<void> {
    try {
        const cookieStore = await cookies()

        if (sessionToken) {
            // Delete specific session from database
            await deleteUserSession(sessionToken)
        } else {
            // Get current session token from cookie
            const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
            if (sessionCookie?.value) {
                await deleteUserSession(sessionCookie.value)
            }
        }

        // Delete session cookie
        cookieStore.delete(SESSION_COOKIE_NAME)
    } catch (error) {
        console.error('Error deleting user session:', error)
    }
}

/**
 * Delete all user sessions (logout from all devices)
 *
 * @param {string} userId - User ID
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
    try {
        const { deleteUserSessions } = await import('../repositories/user.repository')
        await deleteUserSessions(userId)

        // Also delete current session cookie if it exists
        const cookieStore = await cookies()
        cookieStore.delete(SESSION_COOKIE_NAME)
    } catch (error) {
        console.error('Error deleting all user sessions:', error)
    }
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

/**
 * Check if user is authenticated
 *
 * @returns {Promise<boolean>} True if authenticated
 */
export async function isUserAuthenticated(): Promise<boolean> {
    const session = await getUserSession()
    return session !== null
}

/**
 * Check if user has premium access
 *
 * @returns {Promise<boolean>} True if user has premium access
 */
export async function hasPremiumAccess(): Promise<boolean> {
    const session = await getUserSession()
    return session?.isPremium ?? false
}

/**
 * Require premium access (throws if not premium)
 *
 * @throws {PremiumRequiredError} If user doesn't have premium access
 */
export async function requirePremiumAccess(): Promise<void> {
    const session = await getUserSession()

    if (!session) {
        throw new UserSessionExpiredError('Authentication required. Please login.')
    }

    if (!session.isPremium) {
        throw new Error('Premium subscription required to access this content.')
    }
}

/**
 * Refresh session expiration
 *
 * @returns {Promise<UserSessionData | null>} Updated session data
 */
export async function refreshUserSession(): Promise<UserSessionData | null> {
    const session = await getUserSession()

    if (!session) {
        return null
    }

    const newExpiresAt = createSessionExpiration()
    const cookieStore = await cookies()

    // Update session in database
    await deleteUserSession(session.sessionId)
    await createUserSession({
        userId: session.userId,
        token: session.sessionId,
        expiresAt: newExpiresAt,
    })

    // Update cookie expiration
    cookieStore.set(SESSION_COOKIE_NAME, session.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
    })

    return session
}

/**
 * Get session expiration time
 *
 * @returns {Promise<Date | null>} Session expiration time or null if not authenticated
 */
export async function getSessionExpiration(): Promise<Date | null> {
    try {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

        if (!sessionCookie || !sessionCookie.value) {
            return null
        }

        // Get session expiration from database
        const { findUserBySessionToken } = await import('../repositories/user.repository')
        const user = await findUserBySessionToken(sessionCookie.value)

        return user ? new Date() : null
    } catch (error) {
        console.error('Error getting session expiration:', error)
        return null
    }
}

// ============================================================================
// SESSION UTILITIES
// ============================================================================

/**
 * Get session cookie configuration
 *
 * @returns {Object} Cookie configuration object
 */
export function getSessionCookieConfig() {
    return {
        name: SESSION_COOKIE_NAME,
        options: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            maxAge: SESSION_MAX_AGE,
            path: '/',
        },
    }
}

/**
 * Check if session is close to expiration (within 24 hours)
 *
 * @returns {Promise<boolean>} True if session expires within 24 hours
 */
export async function isSessionNearExpiration(): Promise<boolean> {
    const expiresAt = await getSessionExpiration()

    if (!expiresAt) {
        return true // No session, treat as expired
    }

    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    return expiresAt <= twentyFourHoursFromNow
}