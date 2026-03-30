import { Redis } from '@upstash/redis'
import { REDIS_TIMEOUT_MS } from './config'

export interface RedisConfig {
  url: string
  token: string
  timeout?: number
}

export interface IncrementResult {
  count: number
  ttl: number
}

export class RedisClient {
  private redis: Redis
  private timeout: number

  constructor(config: RedisConfig) {
    this.redis = new Redis({
      url: config.url,
      token: config.token,
    })
    this.timeout = config.timeout ?? REDIS_TIMEOUT_MS
  }

  async increment(key: string, ttl: number): Promise<IncrementResult | null> {
    try {
      const result = await Promise.race([
        this.executeIncrement(key, ttl),
        this.timeoutPromise<IncrementResult>()
      ])
      return result
    } catch (error) {
      this.handleError(error as Error, 'increment')
      return null
    }
  }

  private async executeIncrement(key: string, ttl: number): Promise<IncrementResult> {
    // Use pipeline for atomic INCR + EXPIRE
    const pipeline = this.redis.pipeline()
    pipeline.incr(key)
    pipeline.expire(key, ttl)
    
    const results = await pipeline.exec()
    const count = results[0] as number
    
    return { count, ttl }
  }

  async get(key: string): Promise<number | null> {
    try {
      const result = await Promise.race([
        this.redis.get<number>(key),
        this.timeoutPromise<number | null>()
      ])
      
      // Validate and sanitize
      if (typeof result === 'number' && result >= 0) {
        return result
      }
      
      if (result !== null) {
        console.warn(`[RedisClient] Invalid counter value for key ${key}: ${result}`)
      }
      
      return null
    } catch (error) {
      this.handleError(error as Error, 'get')
      return null
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await Promise.race([
        this.redis.del(key),
        this.timeoutPromise<void>()
      ])
    } catch (error) {
      this.handleError(error as Error, 'reset')
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await Promise.race([
        this.redis.ping(),
        this.timeoutPromise<string>()
      ])
      return true
    } catch (error) {
      this.handleError(error as Error, 'healthCheck')
      return false
    }
  }

  private timeoutPromise<T>(): Promise<T> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis operation timeout')), this.timeout)
    )
  }

  private handleError(error: Error, operation: string): void {
    console.error(`[RedisClient] ${operation} failed:`, error.message)
  }
}
