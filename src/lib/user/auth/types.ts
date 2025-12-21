/**
 * User Authentication Type Definitions
 *
 * Following Single Responsibility Principle (SRP):
 * This file contains only type definitions for the user authentication system
 */

// ============================================================================
// USER AUTH INTENTS - Enum for user authentication flow types
// ============================================================================
export enum UserAuthIntent {
  LOGIN = 'USER_LOGIN',
  REGISTER = 'USER_REGISTER',
  RESET_PASSWORD = 'USER_RESET_PASSWORD',
  EMAIL_CHANGE = 'USER_EMAIL_CHANGE',
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface UserApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface CheckUserEmailResponse {
  exists?: boolean
  canLogin?: boolean
  canRegister?: boolean
  canResetPassword?: boolean
  resumeRegistration?: boolean
  resumeReset?: boolean
}

export interface UserLoginResponse {
  success: true
  user: {
    id: string
    email: string
    name: string
    isPremium: boolean
  }
}

export interface SendUserOtpResponse {
  success: true
  expiresAt: string
}

export interface VerifyUserOtpResponse {
  verified: true
  sessionExpiresAt: string
}

export interface CreateUserResponse {
  success: true
  user: {
    id: string
    email: string
    name: string
    isPremium: boolean
  }
}

// ============================================================================
// USER SESSION TYPES
// ============================================================================

export interface UserSessionData {
  userId: string
  email: string
  name: string
  isPremium: boolean
  sessionId: string
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export interface SubscriptionInfo {
  plan: string
  isActive: boolean
  startDate?: Date
  endDate?: Date
  isExpired: boolean
  daysRemaining?: number
}

// ============================================================================
// READING PROGRESS TYPES
// ============================================================================

export interface BookReadingProgress {
  bookId: string
  currentPage?: number
  currentEpocha?: number
  progress: number
  isCompleted: boolean
  lastReadAt: Date
}

// ============================================================================
// USER PROFILE TYPES
// ============================================================================

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar?: string
  isPremium: boolean
  createdAt: Date
  readingStats: {
    totalBooks: number
    completedBooks: number
    inProgressBooks: number
    completionRate: number
  }
  bookshelfStats: {
    totalBookshelves: number
    publicBookshelves: number
    privateBookshelves: number
    totalBooks: number
    averageBooksPerShelf: number
  }
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class UserAuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'UserAuthenticationError'
  }
}

export class UserRateLimitError extends Error {
  constructor(
    message: string = 'Too many requests. Please try again later.',
    public retryAfter: number = 60
  ) {
    super(message)
    this.name = 'UserRateLimitError'
  }
}

export class UserSessionExpiredError extends Error {
  constructor(message: string = 'User session expired. Please login again.') {
    super(message)
    this.name = 'UserSessionExpiredError'
  }
}

export class PremiumRequiredError extends Error {
  constructor(message: string = 'Premium subscription required to access this content.') {
    super(message)
    this.name = 'PremiumRequiredError'
  }
}