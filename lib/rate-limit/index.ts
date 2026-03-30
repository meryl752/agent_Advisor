import { RedisClient } from './redis'
import { RateLimiter } from './limiter'
import { getUserPlanFromSupabase } from './user-plan'

// Initialize Redis client
let rateLimiterInstance: RateLimiter | null = null

export function getRateLimiter(): RateLimiter | null {
  // Return null if Redis not configured (allows graceful degradation)
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('[RateLimiter] Upstash Redis not configured - rate limiting disabled')
    return null
  }

  // Lazy initialization
  if (!rateLimiterInstance) {
    const redisClient = new RedisClient({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    rateLimiterInstance = new RateLimiter({
      redis: redisClient,
      getUserPlan: getUserPlanFromSupabase,
    })

    console.log('[RateLimiter] Initialized with Upstash Redis')
  }

  return rateLimiterInstance
}

// Export for convenience
export { withRateLimit } from './middleware'
export type { RateLimitResult } from './limiter'
