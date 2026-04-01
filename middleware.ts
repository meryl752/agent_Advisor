import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/api/recommend(.*)', '/api/stack-chat(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Handle ?reset_onboarding=true — just redirect to /onboarding, the page handles the reset
  const url = new URL(req.url)
  if (url.searchParams.has('reset_onboarding') && userId) {
    url.searchParams.delete('reset_onboarding')
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // Protect dashboard and API routes — Clerk handles auth only
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // /onboarding requires auth
  if (req.nextUrl.pathname.startsWith('/onboarding')) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
