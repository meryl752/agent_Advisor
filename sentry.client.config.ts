import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay (records user interactions on errors)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and inputs by default (GDPR)
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Don't send errors in development
  enabled: process.env.NODE_ENV === 'production',

  // Filter out noise
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    /^Network Error$/,
    /^Request aborted$/,
  ],

  beforeSend(event) {
    // Strip PII from error events
    if (event.user) {
      delete event.user.email
      delete event.user.ip_address
    }
    return event
  },
})
