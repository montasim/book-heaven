'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  underConstruction: z.boolean().optional(),
  underConstructionMessage: z.string().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
})

/**
 * GET /api/admin/site/settings
 * Get all system settings (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Get or create system settings
    let settings = await prisma.systemSettings.findFirst()

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {},
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error: any) {
    console.error('Get admin site settings error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch site settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/site/settings
 * Update system settings (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateSettingsSchema.parse(body)

    // Get existing settings
    let settings = await prisma.systemSettings.findFirst()

    if (!settings) {
      // Create settings if they don't exist
      settings = await prisma.systemSettings.create({
        data: validatedData,
      })
    } else {
      // Update existing settings
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: validatedData,
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully',
    })
  } catch (error: any) {
    console.error('Update site settings error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update site settings' },
      { status: 500 }
    )
  }
}
