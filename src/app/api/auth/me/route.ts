/**
 * Get Current User Endpoint
 * 
 * GET /api/auth/me
 * 
 * Returns the currently authenticated admin's information
 * 
 * Security:
 * - Requires valid session cookie
 * - Returns 401 if not authenticated
 */

import { NextRequest } from 'next/server'
import { getSession, deleteSession } from '@/lib/auth/session'
import { findAdminById } from '@/lib/auth/repositories/admin.repository'
import { successResponse, errorResponse } from '@/lib/auth/request-utils'
import { getUserDisplayName } from '@/lib/utils/user'

export async function GET(request: NextRequest) {
    try {
        // Get session from cookie
        const session = await getSession()

        if (!session) {
            // Delete any invalid/empty cookies and return error
            const response = errorResponse('Not authenticated', 401)
            response.cookies.delete('admin_session')
            return response
        }

        // Fetch admin from database to ensure it still exists
        const admin = await findAdminById(session.adminId)

        if (!admin) {
            // Admin doesn't exist anymore, delete session and return error
            await deleteSession()
            const response = errorResponse('Admin account not found', 404)
            response.cookies.delete('admin_session')
            return response
        }

        // Construct display name with fallbacks
        const displayName = getUserDisplayName({
            firstName: admin.firstName,
            lastName: admin.lastName,
            username: admin.username,
            name: admin.name,
            email: admin.email
        })

        // Return admin data
        return successResponse({
            admin: {
                id: admin.id,
                email: admin.email,
                name: displayName,
                firstName: admin.firstName,
                lastName: admin.lastName,
                username: admin.username,
                createdAt: admin.createdAt,
                updatedAt: admin.updatedAt,
            },
        })
    } catch (error) {
        console.error('Get current user error:', error)
        // Delete invalid session cookie on error
        const response = errorResponse('An error occurred.', 500)
        response.cookies.delete('admin_session')
        return response
    }
}
