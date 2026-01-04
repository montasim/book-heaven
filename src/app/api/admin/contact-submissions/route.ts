import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { ContactStatus } from '@prisma/client'

/**
 * GET /api/admin/contact-submissions
 * Fetch all contact submissions with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin or super admin
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ContactStatus | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch submissions with pagination
    const [submissions, totalCount] = await Promise.all([
      prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contactSubmission.count({ where }),
    ])

    // Calculate stats
    const stats = await prisma.contactSubmission.groupBy({
      by: ['status'],
      _count: true,
    })

    const statsMap = {
      NEW: 0,
      READ: 0,
      RESPONDED: 0,
      ARCHIVED: 0,
    }

    stats.forEach((stat) => {
      statsMap[stat.status] = stat._count
    })

    return NextResponse.json({
      success: true,
      data: {
        submissions,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        stats: statsMap,
      },
    })
  } catch (error: any) {
    console.error('Error fetching contact submissions:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch contact submissions',
        error: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/contact-submissions
 * Update contact submission status
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin or super admin
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: 'id and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    if (!Object.values(ContactStatus).includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = {
      status,
    }

    // Set timestamps based on status
    if (status === ContactStatus.READ && !updateData.readAt) {
      updateData.readAt = new Date()
    } else if (status === ContactStatus.RESPONDED) {
      updateData.respondedAt = new Date()
    }

    // Update submission
    const submission = await prisma.contactSubmission.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: submission,
      message: 'Contact submission updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating contact submission:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update contact submission',
        error: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
