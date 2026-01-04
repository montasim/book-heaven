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
        siteName: settings.siteName,
        siteSlogan: settings.siteSlogan,
        logoUrl: settings.directLogoUrl || settings.logoUrl,
        faviconUrl: settings.directFaviconUrl || settings.faviconUrl,
        seoTitle: settings.seoTitle,
        seoDescription: settings.seoDescription,
        seoKeywords: settings.seoKeywords,
        ogImage: settings.directOgImageUrl || settings.ogImage,
        supportEmail: settings.supportEmail,
        contactEmail: settings.contactEmail,
        socialTwitter: settings.socialTwitter,
        socialGithub: settings.socialGithub,
        socialFacebook: settings.socialFacebook,
        socialInstagram: settings.socialInstagram,
        socialLinkedIn: settings.socialLinkedIn,
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
