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
    requests: 1, 
    windowSeconds: 2592000, // 30 days
    windowLabel: '30 days' 
  },
  { 
    plan: 'pro', 
    requests: 10, 
    windowSeconds: 3600, // 1 hour
    windowLabel: 'hour' 
  },
  { 
    plan: 'agency', 
    requests: 50, 
    windowSeconds: 3600, // 1 hour
    windowLabel: 'hour' 
  }
]

export const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false'
export const REDIS_TIMEOUT_MS = 1000
export const FAIL_OPEN = true // Allow requests when Redis fails
export const ABUSE_THRESHOLD = 5 // Number of 429s in 1 hour before logging warning
export const CONSECUTIVE_FAILURE_THRESHOLD = 10 // Number of consecutive Redis failures before alert
