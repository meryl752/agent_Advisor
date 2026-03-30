// ─── Logo.dev Helper ──────────────────────────────────────────────────────────
// Centralized logo URL generation

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN || 'pk_aJ8Bl7ROS6-FE3fLWji9tQ'

export function getLogoUrl(domain: string): string {
  if (!domain) return ''
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}`
}
