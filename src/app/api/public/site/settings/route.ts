import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/public/site/settings
 * Get public site settings (no auth required)
 */
export async function GET(request: NextRequest) {
  try {
    // Get or create system settings (there should only be one row)
    let settings = await prisma.systemSettings.findFirst()

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {},
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        underConstruction: settings.underConstruction,
        underConstructionMessage: settings.underConstructionMessage,
      },
    })
  } catch (error: any) {
    console.error('Get site settings error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch site settings' },
      { status: 500 }
    )
  }
}
