import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const adminSession = request.cookies.get('admin_session')?.value
    const userSession = request.cookies.get('user_session')?.value
    const { pathname } = request.nextUrl

    // Define route types
    const isAdminRoute = pathname.startsWith('/dashboard')
    const isUserRoute = pathname.startsWith('/(user)') || pathname.startsWith('/books') || pathname.startsWith('/profile') || pathname.startsWith('/bookshelves')
    const isPublicRoute = pathname.startsWith('/(public)')
    const isAuthRoute =
        pathname.startsWith('/auth/sign-in') ||
        pathname.startsWith('/sign-up') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/otp') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register')

    // Function to validate admin session cookie format
    const isValidAdminSession = (sessionValue: string): boolean => {
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

    // Function to validate user session cookie format
    const isValidUserSession = (sessionValue: string): boolean => {
        try {
            const sessionData = sessionValue // User sessions are stored as tokens, not JSON
            return sessionData && sessionData.length > 10 // Basic validation for session token
        } catch {
            return false
        }
    }

    // Handle admin routes
    if (isAdminRoute) {
        if (!adminSession || !isValidAdminSession(adminSession)) {
            // Invalid or missing admin session, delete cookie and redirect
            const response = NextResponse.redirect(new URL('/auth/sign-in', request.url))
            response.cookies.delete('admin_session')
            return response
        }
    }

    // Handle user routes (require user authentication)
    if (isUserRoute && !pathname.startsWith('/books')) { // Books page can be accessed publicly
        if (!userSession || !isValidUserSession(userSession)) {
            // Invalid or missing user session, delete cookie and redirect
            const response = NextResponse.redirect(new URL('/login', request.url))
            response.cookies.delete('user_session')
            return response
        }
    }

    // Handle authentication routes
    if (isAuthRoute) {
        // Admin auth routes
        if (pathname.startsWith('/auth/sign-in') || pathname.startsWith('/auth/')) {
            if (adminSession && isValidAdminSession(adminSession)) {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        }
        // User auth routes
        else if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')) {
            if (userSession && isValidUserSession(userSession)) {
                return NextResponse.redirect(new URL('/books', request.url))
            }
        }
    }

    // Handle root route - redirect based on existing sessions
    if (pathname === '/') {
        if (adminSession && isValidAdminSession(adminSession)) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        } else if (userSession && isValidUserSession(userSession)) {
            return NextResponse.redirect(new URL('/books', request.url))
        } else {
            return NextResponse.redirect(new URL('/books', request.url)) // Default to public books page
        }
    }

    // Clean up invalid sessions
    if (adminSession && !isValidAdminSession(adminSession)) {
        const response = NextResponse.next()
        response.cookies.delete('admin_session')
        return response
    }

    if (userSession && !isValidUserSession(userSession)) {
        const response = NextResponse.next()
        response.cookies.delete('user_session')
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
