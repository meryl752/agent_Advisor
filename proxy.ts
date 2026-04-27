import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Protected routes — require Clerk session
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/en/dashboard(.*)',
  '/es/dashboard(.*)',
  '/api/recommend(.*)',
  '/api/stack-chat(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Handle ?reset_onboarding=true — redirect to /onboarding
  const url = new URL(req.url)
  if (url.searchParams.has('reset_onboarding') && userId) {
    url.searchParams.delete('reset_onboarding')
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // Protect dashboard and API routes
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // /onboarding requires auth (all locale variants)
  const pathname = req.nextUrl.pathname
  if (
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/en/onboarding') ||
    pathname.startsWith('/es/onboarding')
  ) {
    await auth.protect()
  }

  // Run next-intl locale detection/redirect (skip for API routes)
  if (!pathname.startsWith('/api/')) {
    return intlMiddleware(req)
  }
})

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon\\.ico|apple-icon\\.png|apple-touch-icon\\.png|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|map)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
