import { RedisClient } from './redis'
import { UserPlan } from './user-plan'
import { RATE_LIMIT_CONFIGS, RATE_LIMIT_ENABLED, FAIL_OPEN, CONSECUTIVE_FAILURE_THRESHOLD, type RateLimitTierConfig } from './config'

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp
  retryAfter?: number // Seconds
  plan?: UserPlan
}

export interface RateLimiterOptions {
  redis: RedisClient
  getUserPlan: (userId: string) => Promise<UserPlan>
  configs?: RateLimitTierConfig[]
  enabled?: boolean
}

export class RateLimiter {
  private redis: RedisClient
  private getUserPlan: (userId: string) => Promise<UserPlan>
  private configs: RateLimitTierConfig[]
  private enabled: boolean
  private consecutiveFailures: number = 0

  constructor(options: RateLimiterOptions) {
    this.redis = options.redis
    this.getUserPlan = options.getUserPlan
    this.configs = options.configs ?? RATE_LIMIT_CONFIGS
    this.enabled = options.enabled ?? RATE_LIMIT_ENABLED

    // Validate configuration
    if (!this.validateConfigs()) {
      console.warn('[RateLimiter] Invalid configuration detected, using defaults')
      this.configs = RATE_LIMIT_CONFIGS
    }
  }

  async checkLimit(userId: string, endpoint: string): Promise<RateLimitResult> {
    // Bypass if disabled
    if (!this.enabled) {
      return {
        allowed: true,
        limit: 999999,
        remaining: 999999,
        reset: Date.now() + 3600000
      }
    }

    try {
      // Get user plan
      const plan = await this.getUserPlan(userId)
      const config = this.getConfig(plan)

      // Calculate window
      const now = Math.floor(Date.now() / 1000)
      const windowStart = this.calculateWindowStart(now, config.windowSeconds)
      const windowEnd = windowStart + config.windowSeconds

      // Generate Redis key
      const key = this.getRedisKey(userId, endpoint, windowStart)

      // Increment counter
      const result = await this.redis.increment(key, config.windowSeconds)

      if (result === null) {
        // Redis failed - fail open
        this.consecutiveFailures++
        
        if (this.consecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD) {
          console.error(`[RateLimiter] ALERT: ${this.consecutiveFailures} consecutive Redis failures detected`)
        }

        if (FAIL_OPEN) {
          console.warn(`[RateLimiter] Redis failure, allowing request (fail-open)`)
          return {
            allowed: true,
            limit: config.requests,
            remaining: config.requests,
            reset: windowEnd,
            plan
          }
        }
      } else {
        // Reset failure counter on success
        if (this.consecutiveFailures > 0) {
          console.log(`[RateLimiter] Redis recovered after ${this.consecutiveFailures} failures`)
          this.consecutiveFailures = 0
        }
      }

      const count = result?.count ?? 0
      const allowed = count <= config.requests
      const remaining = Math.max(0, config.requests - count)

      if (!allowed) {
        console.log(`[RateLimiter] Rate limit exceeded for user ${userId.substring(0, 8)}*** (${plan} tier): ${count}/${config.requests} requests in ${config.windowLabel}`)
      }

      return {
        allowed,
        limit: config.requests,
        remaining,
        reset: windowEnd,
        retryAfter: allowed ? undefined : windowEnd - now,
        plan
      }
    } catch (error) {
      console.error('[RateLimiter] Unexpected error:', error instanceof Error ? error.message : 'Unknown')
      
      // Fail open on unexpected errors
      if (FAIL_OPEN) {
        return {
          allowed: true,
          limit: 1,
          remaining: 1,
          reset: Date.now() + 3600
        }
      }
      
      throw error
    }
  }

  private getConfig(plan: UserPlan): RateLimitTierConfig {
    const config = this.configs.find(c => c.plan === plan)
    if (!config) {
      console.warn(`[RateLimiter] No config found for plan "${plan}", using free tier`)
      return this.configs.find(c => c.plan === 'free') ?? RATE_LIMIT_CONFIGS[0]
    }
    return config
  }

  private getRedisKey(userId: string, endpoint: string, windowStart: number): string {
    return `ratelimit:${userId}:${endpoint}:${windowStart}`
  }

  private calculateWindowStart(timestamp: number, windowSeconds: number): number {
    return Math.floor(timestamp / windowSeconds) * windowSeconds
  }

  private validateConfigs(): boolean {
    if (!Array.isArray(this.configs) || this.configs.length === 0) {
      return false
    }

    for (const config of this.configs) {
      if (!config.plan || !['free', 'pro', 'agency'].includes(config.plan)) {
        return false
      }
      if (typeof config.requests !== 'number' || config.requests <= 0) {
        return false
      }
      if (typeof config.windowSeconds !== 'number' || config.windowSeconds <= 0) {
        return false
      }
    }

    return true
  }
}
