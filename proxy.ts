import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Protected routes — require Clerk session
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
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

  // /onboarding requires auth
  const pathname = req.nextUrl.pathname
  if (pathname.startsWith('/onboarding')) {
    await auth.protect()
  }

  // Return next response for all non-API routes
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon\\.ico|apple-icon\\.png|apple-touch-icon\\.png|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|map)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
