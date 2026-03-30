import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Lower sample rate in production to control costs
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Don't send in development
  enabled: process.env.NODE_ENV === 'production',

  // Capture unhandled promise rejections
  integrations: [
    Sentry.captureConsoleIntegration({ levels: ['error'] }),
  ],

  beforeSend(event) {
    // Strip PII from server-side errors
    if (event.user) {
      delete event.user.email
      delete event.user.ip_address
    }

    // Redact sensitive request data
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>
      if (data.email) data.email = '[REDACTED]'
      if (data.password) data.password = '[REDACTED]'
    }

    return event
  },
})
