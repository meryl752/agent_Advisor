/**
 * Origine HTTPS du Frontend API Clerk (hôte du script clerk-js).
 * Utilisée pour les en-têtes Link rel=preconnect (TLS + DNS en avance).
 *
 * Définir dans .env.local par ex. :
 *   NEXT_PUBLIC_CLERK_PRECONNECT_ORIGIN=https://diverse-sunbird-41.clerk.accounts.dev
 * (valeur affichée dans le dashboard Clerk → API / domaines → Frontend API)
 */
export function getClerkPreconnectOrigin(): string | null {
  const explicit = process.env.NEXT_PUBLIC_CLERK_PRECONNECT_ORIGIN?.trim()
  if (explicit) {
    try {
      const u = new URL(explicit.startsWith('http') ? explicit : `https://${explicit}`)
      if (u.protocol !== 'https:') return null
      return `${u.protocol}//${u.host}`
    } catch {
      return null
    }
  }

  const domain = process.env.NEXT_PUBLIC_CLERK_DOMAIN?.trim()
  if (domain) {
    const host = domain.replace(/^https?:\/\//, '').split('/')[0]
    if (!host) return null
    try {
      return new URL(`https://${host}`).origin
    } catch {
      return null
    }
  }

  return null
}
