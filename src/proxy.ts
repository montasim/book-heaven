/**
 * Proxy Middleware with Role-Based Access Control (RBAC)
 *
 * This middleware protects both client routes and API routes using a centralized
 * RBAC system. Access permissions are defined in:
 * - client-routes.ts: For page routes
 * - server-routes.ts: For API routes
 *
 * Features:
 * - Cookie-based session validation
 * - Role-based access control
 * - 401 (Unauthorized) for unauthenticated users
 * - 403 (Forbidden) for authenticated but unauthorized users
 * - Auto-redirect for protected routes
 * - API route protection
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ROUTES, type AppRoute } from '@/lib/routes/client-routes'
import { checkApiRouteAccess } from '@/lib/routes/server-routes'
import { UserRole, getAccessDenialStatus, getRedirectUrl, hasAccess, type AccessResult } from '@/lib/auth/roles'

// ============================================================================
// SESSION TYPES
// ============================================================================

interface SessionData {
  userId: string
  email: string
  name: string
  firstName: string
  lastName: string | null
  role: string
  isPremium?: boolean
  avatar?: string | null
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Create an unauthorized response (401)
 * For API routes: Returns 401 JSON
 * For page routes: Redirects to sign-in
 */
function createUnauthorizedResponse(request: NextRequest, isApi: boolean = false): NextResponse {
  if (isApi) {
    return NextResponse.json(
      { error: 'Authentication required. Please sign in.', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const response = NextResponse.redirect(new URL('/auth/sign-in', request.url))
  response.cookies.delete('user_session')
  return response
}

/**
 * Create a forbidden response (403)
 * For API routes: Returns 403 JSON
 * For page routes: Redirects to 403 page
 */
function createForbiddenResponse(request: NextRequest, isApi: boolean = false): NextResponse {
  if (isApi) {
    return NextResponse.json(
      { error: 'Access denied. You do not have permission to access this resource.', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  return NextResponse.redirect(new URL('/403', request.url))
}

/**
 * Create a redirect response for authenticated users accessing auth routes
 */
function createAuthenticatedRedirect(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

/**
 * Parse and validate session cookie
 */
function parseSession(cookieValue: string): { valid: boolean; session?: SessionData } {
  try {
    const sessionData = JSON.parse(cookieValue) as SessionData

    const valid = !!(
      sessionData?.userId &&
      sessionData?.email &&
      sessionData?.name &&
      sessionData?.role
    )

    return {
      valid,
      session: valid ? sessionData : undefined,
    }
  } catch {
    return { valid: false }
  }
}

/**
 * Get user session from request cookies
 */
function getUserSession(request: NextRequest): SessionData | null {
  const userSession = request.cookies.get('user_session')?.value
  if (!userSession) return null

  const result = parseSession(userSession)
  return result.session ?? null
}

/**
 * Get user role from session (returns PUBLIC if no session)
 */
function getUserRole(request: NextRequest): UserRole {
  const session = getUserSession(request)
  return (session?.role as UserRole) ?? UserRole.PUBLIC
}

// ============================================================================
// CLIENT ROUTE ACCESS CHECKS
// ============================================================================

/**
 * Find client route by path
 * Returns the first route whose href matches or starts with the path
 */
function findClientRoute(pathname: string): AppRoute | null {
  // First try exact match
  const exactMatch = Object.values(ROUTES).find((route) => route.href === pathname)
  if (exactMatch) {
    return exactMatch
  }

  // Then try prefix match for nested routes
  // Sort by length descending to match most specific route first
  const sortedRoutes = Object.values(ROUTES).sort((a, b) => b.href.length - a.href.length)

  for (const route of sortedRoutes) {
    // Check if pathname starts with route.href
    // Ensure we match whole path segments (e.g., /dashboard should match /dashboard but not /dashboard-xyz)
    if (pathname === route.href || pathname.startsWith(route.href + '/')) {
      return route
    }
  }

  return null
}

/**
 * Check if user can access a client route
 */
function checkClientRouteAccess(
  pathname: string,
  userRole: UserRole
): { allowed: boolean; route?: AppRoute } {
  const route = findClientRoute(pathname)

  if (!route) {
    // No route defined - allow by default (you could change to deny)
    return { allowed: true }
  }

  const allowed = hasAccess(userRole, route.access)
  return { allowed, route }
}

// ============================================================================
// SPECIAL ROUTE HANDLING
// ============================================================================

/**
 * Check if path is an authentication route
 */
function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith('/auth/')
}

/**
 * Check if path should always redirect authenticated users
 * (e.g., auth pages should redirect to dashboard if already logged in)
 */
function shouldRedirectAuthenticated(pathname: string): boolean {
  return isAuthRoute(pathname)
}

/**
 * Check if path is API route
 */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

// ============================================================================
// MAIN PROXY FUNCTION
// ============================================================================

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userRole = getUserRole(request)
  const session = getUserSession(request)
  const isAuthenticated = session !== null

  // ========================================================================
  // API ROUTES
  // ========================================================================

  if (isApiRoute(pathname)) {
    const method = request.method
    const { allowed, route } = checkApiRouteAccess(pathname, userRole, method)

    if (!allowed) {
      const statusCode = getAccessDenialStatus(userRole, route?.access ?? [])
      if (statusCode === 401) {
        return createUnauthorizedResponse(request, true)
      }
      return createForbiddenResponse(request, true)
    }

    return NextResponse.next()
  }

  // ========================================================================
  // AUTH ROUTES - Redirect authenticated users
  // ========================================================================

  if (shouldRedirectAuthenticated(pathname) && isAuthenticated) {
    return createAuthenticatedRedirect(request)
  }

  // ========================================================================
  // CLIENT ROUTES - RBAC Check
  // ========================================================================

  const { allowed, route } = checkClientRouteAccess(pathname, userRole)

  if (!allowed) {
    const statusCode = getAccessDenialStatus(userRole, route?.access ?? [])

    // For unauthenticated users (401), redirect to sign-in
    if (statusCode === 401) {
      return createUnauthorizedResponse(request, false)
    }

    // For authenticated but unauthorized users (403), redirect to 403 page
    return createForbiddenResponse(request, false)
  }

  // ========================================================================
  // CLEANUP - Remove invalid sessions
  // ========================================================================

  const sessionCookie = request.cookies.get('user_session')
  if (sessionCookie && !isAuthenticated) {
    const response = NextResponse.next()
    response.cookies.delete('user_session')
    return response
  }

  // ========================================================================
  // ALLOW REQUEST
  // ========================================================================

  return NextResponse.next()
}

// ============================================================================
// ROUTE MATCHER CONFIGURATION
// ============================================================================

/**
 * Matcher configuration for Next.js middleware
 * Matches all paths except:
 * - /api (handled separately)
 * - /_next/static (static files)
 * - /_next/image (image optimization)
 * - favicon.ico
 */
export const matcher = [
  /*
   * Match all request paths except for the ones starting with:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  '/((?!_next/static|_next/image|favicon.ico).*)',
]
