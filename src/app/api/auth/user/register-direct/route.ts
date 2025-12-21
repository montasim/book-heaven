/**
 * Direct User Registration API Route
 *
 * Simple registration without OTP verification for testing/development
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hashPassword } from '@/lib/auth/crypto'
import { createUser, userExists, createUserSession } from '@/lib/user/repositories/user.repository'
import { createUserLoginSession } from '@/lib/user/auth/session'

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
})

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = RegisterSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: validationResult.error.issues[0]?.message
      }, { status: 400 })
    }

    const { name, email, password } = validationResult.data

    // Check if user already exists
    const existingUser = await userExists(email)
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User already exists',
        message: 'An account with this email already exists. Try logging in instead.'
      }, { status: 409 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user account
    const user = await createUser({
      email,
      name,
      passwordHash,
      isActive: true,
      isPremium: false,
    })

    // Create default user session
    await createUserSession({
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    })

    // Create user login session
    await createUserLoginSession(
      user.id,
      user.email,
      user.name,
      user.isPremium
    )

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isPremium: user.isPremium,
          isActive: user.isActive,
          createdAt: user.createdAt,
        }
      },
      message: 'Account created successfully!'
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during registration. Please try again.'
    }, { status: 500 })
  }
}