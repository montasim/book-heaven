import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const session = request.cookies.get('admin_session')?.value
    const { pathname } = request.nextUrl

    // Define protected routes
    const isDashboardRoute = pathname.startsWith('/dashboard')

    // Define authentication routes
    const isAuthRoute =
        pathname.startsWith('/auth/sign-in') ||
        pathname.startsWith('/sign-up') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/otp')

    // Function to validate session cookie format
    const isValidSessionFormat = (sessionValue: string): boolean => {
        try {
            const sessionData = JSON.parse(sessionValue)
            return sessionData &&
                   sessionData.adminId &&
                   sessionData.email &&
                   sessionData.name
        } catch {
            return false
        }
    }

    // Logic for protected routes
    if (isDashboardRoute) {
        if (!session || !isValidSessionFormat(session)) {
            // Invalid or missing session, delete cookie and redirect to sign-in
            const response = NextResponse.redirect(new URL('/auth/sign-in', request.url))
            response.cookies.delete('admin_session')
            return response
        }
    }

    // Logic for authentication routes
    if (isAuthRoute) {
        if (session && isValidSessionFormat(session)) {
            // Already have valid session, redirect to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // Handle root route
    if (pathname === '/') {
        const hasValidSession = session && isValidSessionFormat(session)
        const response = NextResponse.redirect(new URL(hasValidSession ? '/dashboard' : '/auth/sign-in', request.url))

        // If session is invalid, delete it
        if (session && !isValidSessionFormat(session)) {
            response.cookies.delete('admin_session')
        }

        return response
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
