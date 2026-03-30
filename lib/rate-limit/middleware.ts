import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { RateLimiter, type RateLimitResult } from './limiter'

export type NextRouteHandler = (req: NextRequest) => Promise<NextResponse>

export interface RateLimitMiddlewareOptions {
  limiter: RateLimiter
  endpoint: string
}

export function withRateLimit(
  handler: NextRouteHandler,
  options: RateLimitMiddlewareOptions
): NextRouteHandler {
  return async (req: NextRequest) => {
    try {
      // Get authenticated user
      const user = await currentUser()
      
      if (!user) {
        return NextResponse.json(
          { error: 'Non autorisé' },
          { status: 401 }
        )
      }

      // Check rate limit
      const result = await options.limiter.checkLimit(user.id, options.endpoint)

      // If rate limit exceeded, return 429
      if (!result.allowed) {
        return createRateLimitResponse(result)
      }

      // Execute handler and add rate limit headers
      const response = await handler(req)
      return addRateLimitHeaders(response, result)
    } catch (error) {
      console.error('[withRateLimit] Middleware error:', error instanceof Error ? error.message : 'Unknown')
      throw error
    }
  }
}

export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const planLabel = result.plan ? ` for ${result.plan} tier` : ''
  const config = result.plan ? getConfigLabel(result.plan, result.limit) : ''
  
  const response = NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: `Rate limit exceeded${planLabel}: ${result.limit} requests per ${config}`,
      plan: result.plan ?? 'free',
      reset_at: new Date(result.reset * 1000).toISOString(),
      limit: result.limit,
      remaining: 0,
      reset: new Date(result.reset * 1000).toISOString(),
      retryAfter: result.retryAfter
    },
    { status: 429 }
  )

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', '0')
  response.headers.set('X-RateLimit-Reset', result.reset.toString())
  
  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString())
  }

  return response
}

export function addRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toString())
  
  return response
}

function getConfigLabel(plan: string, limit: number): string {
  if (plan === 'free') return '30 days'
  if (plan === 'pro' || plan === 'agency') return 'hour'
  return 'period'
}
