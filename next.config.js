const { withSentryConfig } = require('@sentry/nextjs')

/**
 * @returns {string | null} Valeur pour l'en-tête HTTP Link (preconnect Clerk)
 */
function clerkPreconnectLinkHeader() {
  const raw =
    process.env.NEXT_PUBLIC_CLERK_PRECONNECT_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_CLERK_DOMAIN?.trim()
  if (!raw) return null
  try {
    const url = raw.startsWith('http') ? raw : `https://${raw.replace(/^https?:\/\//, '').split('/')[0]}`
    const origin = new URL(url).origin
    return `<${origin}>; rel=preconnect; crossorigin`
  } catch {
    return null
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
      { protocol: 'https', hostname: 'img.logo.dev' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'www.google.com' },
    ],
  },
  async headers() {
    const link = clerkPreconnectLinkHeader()
    if (!link) return []
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Link', value: link }],
      },
    ]
  },
}

module.exports = withSentryConfig(
  nextConfig,
  {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: !process.env.SENTRY_AUTH_TOKEN,
    widenClientFileUpload: true,
    hideSourceMaps: true,
  }
)
