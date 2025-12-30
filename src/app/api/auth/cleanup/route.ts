/**
 * Cleanup Jobs Endpoint
 *
 * POST /api/auth/cleanup
 *
 * Manually trigger cleanup of expired OTPs and sessions
 *
 * Security:
 * - Protected by API key authentication
 * - For development/testing or cron job invocation
 * - Validates API key format and checks against environment variable
 */

import { NextRequest } from 'next/server'
import { runAllCleanupJobs } from '@/lib/auth/cleanup'
import { successResponse, errorResponse } from '@/lib/auth/request-utils'

const CLEANUP_API_KEY = process.env.CLEANUP_API_KEY || 'dev-cleanup-key-change-in-production'
const EXPECTED_API_KEY_FORMAT = /^[a-zA-Z0-9_-]{16,}$/

function validateApiKey(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
        return false
    }
    // Check length
    if (apiKey.length < 16 || apiKey.length > 128) {
        return false
    }
    // Check format
    return EXPECTED_API_KEY_FORMAT.test(apiKey.trim())
}

export async function POST(request: NextRequest) {
    try {
        // Verify API key from headers
        const authHeader = request.headers.get('authorization') || request.headers.get('x-api-key')

        if (!authHeader) {
            return errorResponse('Authentication required', 401)
        }

        // Extract key (support both "Bearer <key>" and raw key formats)
        const apiKey = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader

        // Validate API key format
        if (!validateApiKey(apiKey)) {
            return errorResponse('Invalid API key format', 401)
        }

        // Verify API key matches expected value
        if (apiKey !== CLEANUP_API_KEY) {
            return errorResponse('Unauthorized', 401)
        }

        const results = await runAllCleanupJobs()

        return successResponse({
            message: 'Cleanup completed successfully',
            results,
        })
    } catch (error) {
        console.error('Cleanup jobs error:', error)
        return errorResponse('Cleanup failed', 500)
    }
}
