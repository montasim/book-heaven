/**
 * Admin Repository
 * 
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Admin model
 * 
 * Benefits:
 * - Separation of concerns (business logic from data access)
 * - Easy to test and mock
 * - Centralized database queries
 */

import { prisma } from '../../prisma'

// ============================================================================
// ADMIN QUERIES
// ============================================================================

/**
 * Find admin by email
 * 
 * @param {string} email - Admin email
 * @returns {Promise<Admin | null>} Admin or null if not found
 */
export async function findAdminByEmail(email: string) {
    return prisma.admin.findUnique({
        where: { email },
    })
}

/**
 * Find admin by ID
 * 
 * @param {string} id - Admin ID
 * @returns {Promise<Admin | null>} Admin or null if not found
 */
export async function findAdminById(id: string) {
    return prisma.admin.findUnique({
        where: { id },
    })
}

/**
 * Check if admin exists by email
 *
 * @param {string} email - Admin email
 * @returns {Promise<boolean>} True if admin exists
 */
export async function adminExists(email: string): Promise<boolean> {
    const count = await prisma.admin.count({
        where: { email },
    })
    return count > 0
}

/**
 * Get all admins
 *
 * @returns {Promise<Admin[]>} Array of all admins
 */
export async function getAllAdmins() {
    return prisma.admin.findMany({
        orderBy: { createdAt: 'desc' },
    })
}

// ============================================================================
// ADMIN MUTATIONS
// ============================================================================

/**
 * Create a new admin
 *
 * @param {Object} data - Admin data
 * @param {string} data.email - Admin email
 * @param {string} data.firstName - Admin first name
 * @param {string} [data.lastName] - Admin last name
 * @param {string} data.passwordHash - Hashed password
 * @param {string} [data.phoneNumber] - Optional phone number
 * @returns {Promise<Admin>} Created admin
 */
export async function createAdmin(data: {
    email: string
    firstName: string
    lastName?: string
    passwordHash: string
    phoneNumber?: string
}) {
    return prisma.admin.create({
        data,
    })
}

/**
 * Update admin
 *
 * @param {string} id - Admin ID
 * @param {Object} data - Admin data to update
 * @param {string} [data.firstName] - Admin first name
 * @param {string} [data.lastName] - Admin last name
 * @param {string} [data.email] - Admin email
 * @param {string} [data.phoneNumber] - Admin phone number
 * @param {string} [data.passwordHash] - Admin password hash
 * @returns {Promise<Admin>} Updated admin
 */
export async function updateAdmin(
    id: string,
    data: {
        firstName?: string
        lastName?: string | null
        email?: string
        phoneNumber?: string | null
        passwordHash?: string
    }
) {
    return prisma.admin.update({
        where: { id },
        data,
    })
}

/**
 * Update admin password
 *
 * @param {string} email - Admin email
 * @param {string} passwordHash - New hashed password
 * @returns {Promise<Admin>} Updated admin
 */
export async function updateAdminPassword(
    email: string,
    passwordHash: string
) {
    return prisma.admin.update({
        where: { email },
        data: { passwordHash },
    })
}

/**
 * Delete admin by ID
 * 
 * @param {string} id - Admin ID
 * @returns {Promise<Admin>} Deleted admin
 */
export async function deleteAdmin(id: string) {
    return prisma.admin.delete({
        where: { id },
    })
}
