'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  // Existing fields
  underConstruction: z.boolean().optional(),
  underConstructionMessage: z.string().nullable().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().nullable().optional(),

  // Branding
  siteName: z.string().min(1).max(100),
  siteSlogan: z.string().max(200).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  directLogoUrl: z.string().url().nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
  directFaviconUrl: z.string().url().nullable().optional(),

  // SEO
  seoTitle: z.string().max(60).nullable().optional(),
  seoDescription: z.string().max(160).nullable().optional(),
  seoKeywords: z.string().max(255).nullable().optional(),
  ogImage: z.string().url().nullable().optional(),
  directOgImageUrl: z.string().url().nullable().optional(),

  // Contact
  supportEmail: z.string().email().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  socialTwitter: z.string().url().nullable().optional(),
  socialGithub: z.string().url().nullable().optional(),
  socialFacebook: z.string().url().nullable().optional(),
  socialInstagram: z.string().url().nullable().optional(),
  socialLinkedIn: z.string().url().nullable().optional(),
}).transform((data) => {
  // Convert empty strings to null for optional fields
  const transformed: any = { ...data }

  // List of fields that should be null if empty string
  const nullifyFields = [
    'underConstructionMessage',
    'maintenanceMessage',
    'siteSlogan',
    'logoUrl',
    'directLogoUrl',
    'faviconUrl',
    'directFaviconUrl',
    'seoTitle',
    'seoDescription',
    'seoKeywords',
    'ogImage',
    'directOgImageUrl',
    'supportEmail',
    'contactEmail',
    'socialTwitter',
    'socialGithub',
    'socialFacebook',
    'socialInstagram',
    'socialLinkedIn',
  ]

  nullifyFields.forEach((field) => {
    if (transformed[field] === '') {
      transformed[field] = null
    }
  })

  // Ensure siteName has a default value if empty
  if (!transformed.siteName || transformed.siteName.trim() === '') {
    transformed.siteName = 'Book Heaven'
  }

  return transformed
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
        data: {
          siteName: 'Book Heaven',
        },
      })
    }

    // Ensure siteName exists (for records created before the field was added)
    if (!settings.siteName) {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          siteName: 'Book Heaven',
        },
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

    // Invalidate cache after update
    const { invalidateSiteSettingsCache } = await import('@/lib/cache/site-settings')
    await invalidateSiteSettingsCache()

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
