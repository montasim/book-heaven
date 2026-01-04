import { NextRequest, NextResponse } from 'next/server'
import { sendContactFormEmail } from '@/lib/auth/email'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ContactStatus } from '@prisma/client'

/**
 * POST /api/public/contact
 * Submit contact form, save to database, and send email to admin
 */

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().max(200, 'Subject is too long').optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = contactFormSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, email, subject, message } = validationResult.data

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Save to database
    await prisma.contactSubmission.create({
      data: {
        name,
        email,
        subject: subject || null,
        message,
        ipAddress,
        userAgent,
        status: ContactStatus.NEW,
      },
    })

    // Send the email
    const result = await sendContactFormEmail(name, email, subject || '', message)

    if (!result.success) {
      // Log the error but don't fail the request since we saved to database
      console.error('Failed to send contact email:', result.error)
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully! We\'ll get back to you soon.',
    })
  } catch (error: any) {
    console.error('Contact form submission error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request.',
        error: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
