import { NextResponse } from 'next/server'
import { getRateLimiter } from '@/lib/rate-limit'
import type { RateLimitResult } from '@/lib/rate-limit/limiter'

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, Math.floor(n)))
}

function parseAbuseEnv(value: string | undefined, fallback: number, min: number, max: number): number {
  const n = parseInt(value ?? '', 10)
  if (Number.isNaN(n)) return fallback
  return clampInt(n, min, max)
}

function abuse429Response(result: RateLimitResult, windowSec: number): NextResponse {
  const res = NextResponse.json(
    {
      error: 'Trop de demandes',
      message: `Limite anti-abus (LLM) : ${result.limit} requêtes par fenêtre de ${windowSec}s. Réessayez dans quelques instants.`,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset * 1000).toISOString(),
      retryAfter: result.retryAfter,
    },
    { status: 429 }
  )
  res.headers.set('X-RateLimit-Limit', result.limit.toString())
  res.headers.set('X-RateLimit-Remaining', '0')
  res.headers.set('X-RateLimit-Reset', result.reset.toString())
  if (result.retryAfter != null) res.headers.set('Retry-After', String(result.retryAfter))
  return res
}

/**
 * Limite généreuse par utilisateur sur les routes LLM lourdes (nécessite Redis Upstash).
 * Désactivable : ABUSE_RATE_LIMIT_ENABLED=false
 */
export async function enforceLlmAbuseLimit(
  userId: string,
  kind: 'recommend' | 'guides'
): Promise<NextResponse | null> {
  if (process.env.ABUSE_RATE_LIMIT_ENABLED === 'false') return null

  const limiter = getRateLimiter()
  if (!limiter) return null

  const endpoint = kind === 'recommend' ? 'abuse:llm:recommend' : 'abuse:llm:guides'
  const max =
    kind === 'recommend'
      ? parseAbuseEnv(process.env.RATE_LIMIT_ABUSE_RECOMMEND_MAX, 120, 20, 600)
      : parseAbuseEnv(process.env.RATE_LIMIT_ABUSE_GUIDES_MAX, 90, 20, 600)
  const windowSec =
    kind === 'recommend'
      ? parseAbuseEnv(process.env.RATE_LIMIT_ABUSE_RECOMMEND_WINDOW_SEC, 3600, 60, 86_400)
      : parseAbuseEnv(process.env.RATE_LIMIT_ABUSE_GUIDES_WINDOW_SEC, 3600, 60, 86_400)

  const result = await limiter.checkAbuseBurstLimit(userId, endpoint, max, windowSec)
  if (!result.allowed) return abuse429Response(result, windowSec)
  return null
}
