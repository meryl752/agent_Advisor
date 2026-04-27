const { withSentryConfig } = require('@sentry/nextjs')
const createNextIntlPlugin = require('next-intl/plugin')
const path = require('path')

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Image Optimization ──────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
      { protocol: 'https', hostname: 'img.logo.dev' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'www.google.com' },
    ],
  },
  // ─── Turbopack alias for next-intl (Next.js 16 moved this from experimental.turbo) ──
  turbopack: {
    resolveAlias: {
      'next-intl/config': './i18n/request.ts',
    },
  },
}

module.exports = withSentryConfig(
  withNextIntl(nextConfig),
  {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  hideSourceMaps: true,
})
