import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/api/recommend(.*)', '/api/stack-chat(.*)'])
const isOnboardingRoute = createRouteMatcher(['/onboarding'])
const isNonApiRoute = (pathname: string) => !pathname.startsWith('/api')

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Handle ?reset_onboarding=true before anything else
  const url = new URL(req.url)
  if (url.searchParams.has('reset_onboarding')) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    // Call reset via Supabase REST API directly (Edge-safe)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && serviceKey) {
        await fetch(
          `${supabaseUrl}/rest/v1/users?clerk_id=eq.${encodeURIComponent(userId)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ onboarding_completed: false, onboarding_step: 0 }),
          }
        )
      }
    } catch (err) {
      console.error('[middleware] reset_onboarding failed:', err)
    }
    url.searchParams.delete('reset_onboarding')
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  if (isProtectedRoute(req) || isOnboardingRoute(req)) {
    await auth.protect()

    // Only check onboarding for non-API routes
    if (userId && isNonApiRoute(req.nextUrl.pathname)) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (supabaseUrl && serviceKey) {
          const res = await fetch(
            `${supabaseUrl}/rest/v1/users?clerk_id=eq.${encodeURIComponent(userId)}&select=onboarding_completed`,
            {
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
              },
            }
          )

          if (res.ok) {
            const rows = await res.json() as Array<{ onboarding_completed: boolean | null }>
            const row = rows[0]

            // If column doesn't exist or user not found → fail open (allow dashboard)
            if (!row) {
              // User not in DB yet, let them through
              if (isOnboardingRoute(req)) {
                return NextResponse.redirect(new URL('/dashboard', req.url))
              }
              return NextResponse.next()
            }

            // If column is null (not yet migrated) → treat as completed, fail open
            const completed = row.onboarding_completed ?? true

            if (!completed && !isOnboardingRoute(req)) {
              return NextResponse.redirect(new URL('/onboarding', req.url))
            }
            if (completed && isOnboardingRoute(req)) {
              return NextResponse.redirect(new URL('/dashboard', req.url))
            }
          }
        }
      } catch (err) {
        // Fail open — allow navigation
        console.error('[middleware] onboarding check failed:', err)
      }
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
