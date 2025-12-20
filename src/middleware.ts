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

    // Logic for protected routes
    if (isDashboardRoute) {
        if (!session) {
            // Not logged in, redirect to sign-in
            return NextResponse.redirect(new URL('/auth/sign-in', request.url))
        }
    }

    // Logic for authentication routes
    if (isAuthRoute) {
        if (session) {
            // Already logged in, redirect to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // Handle root route
    if (pathname === '/') {
        return NextResponse.redirect(new URL(session ? '/dashboard' : '/auth/sign-in', request.url))
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
