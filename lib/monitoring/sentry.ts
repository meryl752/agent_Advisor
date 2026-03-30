import * as Sentry from '@sentry/nextjs'
import { anonymizeId, anonymizeEmail } from '@/lib/utils/logger'

// ─── Error Capture ────────────────────────────────────────────────────────────

interface ErrorContext {
  userId?: string
  endpoint?: string
  action?: string
  extra?: Record<string, unknown>
}

/**
 * Capture an error with anonymized context
 */
export function captureError(error: unknown, context?: ErrorContext): void {
  Sentry.withScope((scope) => {
    if (context?.userId) {
      // Set anonymized user ID (never expose full ID)
      scope.setUser({ id: anonymizeId(context.userId) })
    }

    if (context?.endpoint) {
      scope.setTag('endpoint', context.endpoint)
    }

    if (context?.action) {
      scope.setTag('action', context.action)
    }

    if (context?.extra) {
      scope.setExtras(context.extra)
    }

    Sentry.captureException(error)
  })
}

/**
 * Capture a message/event (non-error)
 */
export function captureEvent(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: ErrorContext
): void {
  Sentry.withScope((scope) => {
    if (context?.userId) {
      scope.setUser({ id: anonymizeId(context.userId) })
    }
    if (context?.endpoint) {
      scope.setTag('endpoint', context.endpoint)
    }

    Sentry.captureMessage(message, level)
  })
}

// ─── Performance Monitoring ───────────────────────────────────────────────────

/**
 * Wrap an async function with Sentry performance tracing
 */
export async function withTracing<T>(
  name: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan({ name, op: operation }, fn)
}

// ─── API Route Error Handler ──────────────────────────────────────────────────

/**
 * Standard error handler for API routes
 * Captures to Sentry and returns a safe error response
 */
export function handleApiError(
  error: unknown,
  context?: ErrorContext
): { message: string; status: number } {
  captureError(error, context)

  // Don't expose internal error details to clients
  if (error instanceof Error) {
    // Log internally with full details
    console.error(`[API Error] ${context?.endpoint ?? 'unknown'}:`, error.message)
  }

  return {
    message: 'Erreur serveur interne',
    status: 500,
  }
}

// ─── Rate Limit Monitoring ────────────────────────────────────────────────────

/**
 * Track rate limit violations in Sentry for abuse detection
 */
export function trackRateLimitViolation(userId: string, plan: string, endpoint: string): void {
  Sentry.withScope((scope) => {
    scope.setUser({ id: anonymizeId(userId) })
    scope.setTag('plan', plan)
    scope.setTag('endpoint', endpoint)
    scope.setLevel('warning')
    Sentry.captureMessage(`Rate limit exceeded: ${plan} tier on ${endpoint}`, 'warning')
  })
}

// ─── User Context ─────────────────────────────────────────────────────────────

/**
 * Set the current user context for Sentry (anonymized)
 */
export function setSentryUser(clerkId: string): void {
  Sentry.setUser({ id: anonymizeId(clerkId) })
}

/**
 * Clear user context on sign out
 */
export function clearSentryUser(): void {
  Sentry.setUser(null)
}
