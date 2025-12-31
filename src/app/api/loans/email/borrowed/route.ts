/**
 * Book Loan Email Notification API Routes
 *
 * Handles sending emails for loan events:
 * - Book borrowed notification
 * - Book returned notification
 * - Due date reminder
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserDisplayName } from '@/lib/utils/user'

const FROM_EMAIL = process.env.RESEND_API_KEY ? 'onboarding@resend.dev' : 'onboarding@resend.dev'
const APP_NAME = 'Book Heaven'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

function emailTemplateWrapper(content: string, previewText?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <style>
    body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; }
    .info-box { background-color: #eff6ff; border-left: 4px solid #1e3a5f; padding: 16px 20px; margin: 24px 0; border-radius: 8px; }
    .warning-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 24px 0; border-radius: 8px; }
    .danger-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px 20px; margin: 24px 0; border-radius: 8px; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="background-color: #f8fafc; padding: 32px 16px;">
    <div class="email-container" style="border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%); padding: 48px 32px 32px 32px; text-align: center;">
        <div style="color: #ffffff; font-size: 32px; font-weight: 800;">📚 ${APP_NAME}</div>
      </div>
      <!-- Content -->
      <div style="padding: 48px 40px 32px 40px;">
        ${content}
      </div>
      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
          &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Book Borrowed Email Template
 * Sent to user when they borrow a book
 */
function getBookBorrowedEmailTemplate(
  userName: string,
  bookName: string,
  dueDate: string,
  loanId: string,
  notes?: string
): { subject: string; html: string } {
  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 24px; font-weight: 700; text-align: center;">
      Book Borrowed Successfully! 📚
    </h2>

    <p style="color: #475569; font-size: 16px; line-height: 1.7; text-align: center;">
      Hi ${userName}, you've successfully borrowed a book from ${APP_NAME}.
    </p>

    <!-- Book Details -->
    <div style="background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; color: #065f46; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
        Borrowed Book
      </p>
      <p style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700;">
        "${bookName}"
      </p>
    </div>

    <!-- Due Date -->
    <div style="background: #eff6ff; border-left: 4px solid #1e3a5f; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600;">
        📅 Due Date:
      </p>
      <p style="margin: 0; color: #0f172a; font-size: 18px; font-weight: 600;">
        ${dueDate}
      </p>
      ${notes ? `<p style="margin: 12px 0 0 0; color: #64748b; font-size: 13px;"><em>${notes}</em></p>` : ''}
    </div>

    <!-- Info Box -->
    <div class="info-box">
      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
        <strong>📝 Please Remember:</strong><br />
        Return the book by the due date to avoid any late fees. You'll receive a reminder email one day before the due date.
      </p>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin-top: 32px;">
      <a href="${BASE_URL}/profile/loans" class="button">View My Borrowed Books</a>
    </div>
  `

  return {
    subject: `Book Borrowed: ${bookName}`,
    html: emailTemplateWrapper(content, 'Book Borrowed Successfully')
  }
}

/**
 * Book Returned Email Template
 * Sent to user and admin when book is returned
 */
function getBookReturnedEmailTemplate(
  userName: string,
  bookName: string,
  returnDate: string
): { subject: string; html: string } {
  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 24px; font-weight: 700; text-align: center;">
      Book Returned Successfully! ✅
    </h2>

    <p style="color: #475569; font-size: 16px; line-height: 1.7; text-align: center;">
      ${userName} has returned the book to ${APP_NAME}.
    </p>

    <!-- Book Details -->
    <div style="background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; color: #065f46; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
        Returned Book
      </p>
      <p style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700;">
        "${bookName}"
      </p>
    </div>

    <!-- Return Date -->
    <div style="background: #eff6ff; border-left: 4px solid #1e3a5f; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600;">
        📅 Return Date:
      </p>
      <p style="margin: 0; color: #0f172a; font-size: 18px; font-weight: 600;">
        ${returnDate}
      </p>
    </div>

    <!-- Thank You Message -->
    <p style="color: #64748b; font-size: 14px; text-align: center; margin: 32px 0 0 0;">
      Thank you for returning the book on time! We hope you enjoyed reading it.
    </p>
  `

  return {
    subject: `Book Returned: ${bookName}`,
    html: emailTemplateWrapper(content, 'Book Returned Successfully')
  }
}

/**
 * Due Date Reminder Email Template
 * Sent to user and admin 1 day before due date
 */
function getDueDateReminderEmailTemplate(
  userName: string,
  bookName: string,
  dueDate: string,
  daysUntilDue: number
): { subject: string; html: string } {
  const isUrgent = daysUntilDue === 0

  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 24px; font-weight: 700; text-align: center;">
      ${isUrgent ? 'Book Due Today! ⚠️' : 'Return Date Reminder'} 📚
    </h2>

    <p style="color: #475569; font-size: 16px; line-height: 1.7; text-align: center;">
      Hi ${userName}, this is a friendly reminder about your borrowed book.
    </p>

    <!-- Book Details -->
    <div style="background: ${isUrgent ? '#fef2f2' : '#fef3c7'}; border: 2px dashed ${isUrgent ? '#ef4444' : '#fbbf24'}; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; color: ${isUrgent ? '#dc2626' : '#92400e'}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
        Book Due ${daysUntilDue === 0 ? 'Today' : daysUntilDue === 1 ? 'Tomorrow' : `in ${daysUntilDue} Days`}
      </p>
      <p style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700;">
        "${bookName}"
      </p>
      <p style="margin: 16px 0 0 0; color: ${isUrgent ? '#dc2626' : '#92400e'}; font-size: 14px;">
        ${isUrgent ? '⏰ Please return today!' : `Please return by ${dueDate}`}
      </p>
    </div>

    ${isUrgent ? `
    <div class="danger-box">
      <p style="margin: 0; color: #dc2626; font-size: 14px; line-height: 1.6;">
        <strong>⚠️ Important:</strong><br />
        The book is due today. Please return it as soon as possible to avoid overdue status.
      </p>
    </div>
    ` : `
    <div class="warning-box">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        <strong>📝 Remember:</strong><br />
        You have ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''} left to return this book. Please plan accordingly.
      </p>
    </div>
    `}

    <!-- Action Button -->
    <div style="text-align: center; margin-top: 32px;">
      <a href="${BASE_URL}/profile/loans" class="button">View My Borrowed Books</a>
    </div>
  `

  return {
    subject: `${isUrgent ? 'URGENT: ' : ''}Return Reminder: ${bookName}`,
    html: emailTemplateWrapper(content, `Book Return Reminder - ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''} remaining`)
  }
}

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * Send book borrowed email
 * POST /api/loans/email/borrowed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loanId, userId } = body

    if (!loanId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch loan details
    const loan = await prisma.bookLoan.findUnique({
      where: { id: loanId },
      include: {
        book: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, username: true } },
        lentBy: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    })

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }

    const userName = getUserDisplayName({
      firstName: loan.user.firstName,
      lastName: loan.user.lastName,
      username: loan.user.username,
      name: '',
      email: loan.user.email
    })

    const dueDateStr = loan.dueDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const { subject, html } = getBookBorrowedEmailTemplate(
      userName,
      loan.book.name,
      dueDateStr,
      loan.id,
      loan.notes || undefined
    )

    // Send email using Resend
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: loan.user.email,
      subject,
      html,
    })

    if (error) {
      console.error('Failed to send borrowed email:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Email sent successfully' })
  } catch (error) {
    console.error('Borrowed email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
