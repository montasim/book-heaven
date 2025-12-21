/**
 * User Email Service
 *
 * Handles sending emails for user authentication (OTP, notifications, etc.)
 * In development, this will log to console
 * In production, integrate with your preferred email service
 */

import { UserAuthIntent } from './types'

// ============================================================================
// EMAIL CONFIGURATION
// ============================================================================

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourbooklibrary.com'
const FROM_NAME = process.env.FROM_NAME || 'Your Book Library'

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Generate OTP email template
 *
 * @param {string} otp - The OTP code
 * @param {string} purpose - Purpose of the OTP (verification, password reset, etc.)
 * @returns {Object} Email subject and body
 */
function generateOtpEmailTemplate(otp: string, purpose: string): {
    subject: string
    html: string
    text: string
} {
    const subject = `Your ${purpose} code`

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    text-align: center;
                    padding: 20px 0;
                }
                .otp-container {
                    background-color: #f8f9fa;
                    border: 2px dashed #6c757d;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 30px 0;
                }
                .otp-code {
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    color: #007bff;
                    margin: 10px 0;
                }
                .footer {
                    text-align: center;
                    font-size: 12px;
                    color: #6c757d;
                    margin-top: 30px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📚 Your Book Library</h1>
            </div>

            <h2>${subject}</h2>
            <p>Your verification code is:</p>

            <div class="otp-container">
                <div class="otp-code">${otp}</div>
                <p><strong>This code will expire in 15 minutes.</strong></p>
            </div>

            <p><strong>Important:</strong></p>
            <ul>
                <li>Never share this code with anyone</li>
                <li>We will never ask for your password via email</li>
                <li>This code can only be used once</li>
            </ul>

            <div class="footer">
                <p>This is an automated message from ${FROM_NAME}. Please do not reply to this email.</p>
                <p>If you didn't request this code, please ignore this email.</p>
            </div>
        </body>
        </html>
    `

    const text = `
Your Book Library - ${subject}

Your verification code is: ${otp}

This code will expire in 15 minutes.

Important:
- Never share this code with anyone
- We will never ask for your password via email
- This code can only be used once

This is an automated message from ${FROM_NAME}. Please do not reply to this email.
If you didn't request this code, please ignore this email.
    `

    return { subject, html, text }
}

// ============================================================================
// EMAIL SENDING FUNCTIONS
// ============================================================================

/**
 * Send OTP email to user
 *
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} purpose - Purpose of the OTP
 */
export async function sendUserOtpEmail(
    email: string,
    otp: string,
    purpose: 'verification' | 'password_reset' | 'email_change' = 'verification'
): Promise<void> {
    const { subject, html, text } = generateOtpEmailTemplate(otp, purpose)

    // In development, just log to console
    if (process.env.NODE_ENV === 'development') {
        console.log('\n' + '='.repeat(50))
        console.log(`📧 OTP EMAIL (Development Mode)`)
        console.log('='.repeat(50))
        console.log(`To: ${email}`)
        console.log(`Subject: ${subject}`)
        console.log(`OTP: ${otp}`)
        console.log('\nHTML Content:')
        console.log(html)
        console.log('\n'.repeat(2))
        return
    }

    // In production, integrate with your email service
    // Examples: SendGrid, AWS SES, Mailgun, etc.

    if (process.env.SENDGRID_API_KEY) {
        await sendWithSendGrid(email, subject, html, text)
    } else if (process.env.AWS_SES_REGION) {
        await sendWithAWSSes(email, subject, html, text)
    } else if (process.env.RESEND_API_KEY) {
        await sendWithResend(email, subject, html)
    } else {
        console.warn('No email service configured. Email would be sent to:', email)
        console.log(`Subject: ${subject}`)
        console.log(`OTP: ${otp}`)
    }
}

/**
 * Send welcome email to new user
 *
 * @param {string} email - Recipient email
 * @param {string} name - User's name
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
    const subject = 'Welcome to Your Book Library! 🎉'

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    text-align: center;
                    padding: 20px 0;
                    background-color: #007bff;
                    color: white;
                    border-radius: 8px;
                }
                .content {
                    padding: 20px 0;
                }
                .cta-button {
                    display: inline-block;
                    background-color: #007bff;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    font-size: 12px;
                    color: #6c757d;
                    margin-top: 30px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎉 Welcome, ${name}!</h1>
                <p>Your account has been successfully created</p>
            </div>

            <div class="content">
                <h2>Get Started with Your Book Library</h2>
                <p>Welcome to your personal book management system! Here's what you can do:</p>

                <ul>
                    <li>📚 Browse our extensive collection of books</li>
                    <li>📖 Read ebooks and listen to audiobooks</li>
                    <li>📊 Track your reading progress</li>
                    <li>📚 Create personal bookshelves</li>
                    <li>🔗 Share your favorite books with friends</li>
                </ul>

                <p>Ready to start reading?</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/books" class="cta-button">
                    Browse Books
                </a>

                <h3>Need Help?</h3>
                <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>

                <p>Happy reading!<br>The Book Library Team</p>
            </div>

            <div class="footer">
                <p>This is an automated message from ${FROM_NAME}. Please do not reply to this email.</p>
            </div>
        </body>
        </html>
    `

    const text = `
Welcome to Your Book Library!

Hi ${name},

Welcome to your personal book management system! Your account has been successfully created.

Here's what you can do:
📚 Browse our extensive collection of books
📖 Read ebooks and listen to audiobooks
📊 Track your reading progress
📚 Create personal bookshelves
🔗 Share your favorite books with friends

Ready to start reading? Visit us at ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/books

Happy reading!
The Book Library Team
    `

    await sendEmail(email, subject, html, text)
}

// ============================================================================
// EMAIL PROVIDER INTEGRATIONS
// ============================================================================

/**
 * Send email using SendGrid
 */
async function sendWithSendGrid(
    to: string,
    subject: string,
    html: string,
    text: string
): Promise<void> {
    // Implementation for SendGrid
    // This would use the @sendgrid/mail package
    console.log(`SendGrid email would be sent to ${to}: ${subject}`)
}

/**
 * Send email using AWS SES
 */
async function sendWithAWSSes(
    to: string,
    subject: string,
    html: string,
    text: string
): Promise<void> {
    // Implementation for AWS SES
    // This would use @aws-sdk/client-ses
    console.log(`AWS SES email would be sent to ${to}: ${subject}`)
}

/**
 * Send email using Resend
 */
async function sendWithResend(
    to: string,
    subject: string,
    html: string
): Promise<void> {
    // Implementation for Resend
    // This would use the resend package
    console.log(`Resend email would be sent to ${to}: ${subject}`)
}

/**
 * Generic email sending function
 */
async function sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
): Promise<void> {
    // In development, just log
    if (process.env.NODE_ENV === 'development') {
        console.log('\n' + '='.repeat(50))
        console.log(`📧 EMAIL (Development Mode)`)
        console.log('='.repeat(50))
        console.log(`To: ${to}`)
        console.log(`Subject: ${subject}`)
        console.log('\nContent:')
        console.log(html)
        console.log('\n'.repeat(2))
        return
    }

    // Try different email providers based on configuration
    try {
        if (process.env.SENDGRID_API_KEY) {
            await sendWithSendGrid(to, subject, html, text || '')
        } else if (process.env.AWS_SES_REGION) {
            await sendWithAWSSes(to, subject, html, text || '')
        } else if (process.env.RESEND_API_KEY) {
            await sendWithResend(to, subject, html)
        } else {
            console.warn('No email service configured')
        }
    } catch (error) {
        console.error('Failed to send email:', error)
        throw error
    }
}