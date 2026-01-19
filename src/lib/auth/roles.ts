/**
 * Role-Based Access Control (RBAC) Constants
 *
 * Defines roles, permissions, and access levels for the application.
 * Used by proxy.ts for route protection and access validation.
 */

// ============================================================================
// USER ROLES
// ============================================================================

/**
 * All available user roles in the system
 * Roles are hierarchical: SUPER_ADMIN > ADMIN > USER > PUBLIC
 */
export enum UserRole {
  /** Public/unauthenticated users */
  PUBLIC = 'PUBLIC',
  /** Authenticated regular users */
  USER = 'USER',
  /** Administrative users */
  ADMIN = 'ADMIN',
  /** Super administrators with full access */
  SUPER_ADMIN = 'SUPER_ADMIN',
}

/**
 * Role hierarchy for inheritance checks
 * Higher index = higher privilege level
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.PUBLIC]: 0,
  [UserRole.USER]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPER_ADMIN]: 3,
} as const

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Access level types for routes
 */
export type AccessLevel = UserRole

/**
 * Access control configuration for routes
 */
export interface AccessConfig {
  /** Array of roles that can access this resource */
  access: readonly AccessLevel[]
}

/**
 * Access check result
 */
export interface AccessResult {
  /** Whether access is granted */
  granted: boolean
  /** HTTP status code for denial (401 or 403) */
  statusCode?: number
  /** Redirect URL for unauthorized access */
  redirectUrl?: string
  /** Reason for denial */
  reason?: string
}

// ============================================================================
// PERMISSION HELPERS
// ============================================================================

/**
 * Check if a user's role meets the minimum required role level
 *
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns Whether the user has sufficient privileges
 */
export function hasRoleLevel(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if a user's role is in the allowed access list
 *
 * @param userRole - The user's current role
 * @param allowedRoles - Array of roles that can access the resource
 * @returns Whether the user has access
 */
export function hasAccess(
  userRole: UserRole | null,
  allowedRoles: readonly AccessLevel[]
): boolean {
  // Treat null/undefined role as PUBLIC
  const normalizedRole = userRole ?? UserRole.PUBLIC
  return allowedRoles.includes(normalizedRole)
}

/**
 * Get the appropriate HTTP status code for access denial
 *
 * @param userRole - The user's current role (null if unauthenticated)
 * @param allowedRoles - Array of roles that can access the resource
 * @returns 401 if unauthenticated, 403 if authenticated but unauthorized
 */
export function getAccessDenialStatus(
  userRole: UserRole | null,
  allowedRoles: readonly AccessLevel[]
): 401 | 403 {
  // If user is not authenticated at all
  if (!userRole || userRole === UserRole.PUBLIC) {
    return 401
  }

  // If user is authenticated but lacks the required role
  if (!hasAccess(userRole, allowedRoles)) {
    return 403
  }

  // Should not happen if hasAccess returns false
  return 403
}

/**
 * Get redirect URL based on access denial reason
 *
 * @param statusCode - HTTP status code (401 or 403)
 * @param requestUrl - The original request URL
 * @returns Redirect URL
 */
export function getRedirectUrl(
  statusCode: 401 | 403,
  requestUrl: string
): string {
  if (statusCode === 401) {
    // Unauthenticated - redirect to sign in
    return new URL('/auth/sign-in', requestUrl).href
  }

  if (statusCode === 403) {
    // Unauthorized - redirect to 403 page or dashboard
    return new URL('/403', requestUrl).href
  }

  return new URL('/auth/sign-in', requestUrl).href
}

// ============================================================================
// CONVENIENCE ROLE ARRAYS
// ============================================================================

/**
 * Common role combinations for quick access
 */
export const RoleAccess = {
  /** Everyone can access */
  ALL: [UserRole.PUBLIC, UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  /** Authenticated users only */
  AUTHENTICATED: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  /** Admin users only */
  ADMIN_ONLY: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  /** Super admin only */
  SUPER_ADMIN_ONLY: [UserRole.SUPER_ADMIN],
} as const
