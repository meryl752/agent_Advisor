// Rate Limiting Configuration

export interface RateLimitTierConfig {
  plan: 'free' | 'pro' | 'agency'
  requests: number
  windowSeconds: number
  windowLabel: string
}

export const RATE_LIMIT_CONFIGS: RateLimitTierConfig[] = [
  { 
    plan: 'free', 
    requests: 10,           // 10 stacks / 30 jours (Early Adopter)
    windowSeconds: 2592000, // 30 days
    windowLabel: '30 days' 
  },
  { 
    plan: 'pro', 
    requests: 50,           // 50 stacks / heure
    windowSeconds: 3600,
    windowLabel: 'hour' 
  },
  { 
    plan: 'agency', 
    requests: 200,          // 200 stacks / heure
    windowSeconds: 3600,
    windowLabel: 'hour' 
  }
]

// Set RATE_LIMIT_ENABLED=false in .env.local to disable rate limiting in dev
export const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false'
export const REDIS_TIMEOUT_MS = 1000
export const FAIL_OPEN = true // Allow requests when Redis fails
export const ABUSE_THRESHOLD = 5
export const CONSECUTIVE_FAILURE_THRESHOLD = 10
