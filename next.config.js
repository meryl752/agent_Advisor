const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Image Optimization ──────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
      { protocol: 'https', hostname: 'img.logo.dev' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Silent during builds unless SENTRY_AUTH_TOKEN is set
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps only in CI/production
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,

  // Automatically tree-shake Sentry logger statements
  automaticVercelMonitors: true,
})
