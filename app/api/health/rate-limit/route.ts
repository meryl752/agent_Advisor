import { NextResponse } from 'next/server'
import { getRateLimiter } from '@/lib/rate-limit'

export async function GET() {
  try {
    const rateLimiter = getRateLimiter()

    if (!rateLimiter) {
      return NextResponse.json({
        status: 'disabled',
        message: 'Rate limiting is not configured',
        redis: 'not_configured'
      })
    }

    // Check Redis health
    const isHealthy = await (rateLimiter as any).redis.healthCheck()

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      redis: isHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      redis: 'error'
    }, { status: 500 })
  }
}
