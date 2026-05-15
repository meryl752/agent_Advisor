/**
 * Détection des erreurs réseau côté client Supabase (Node fetch / undici).
 * Ce ne sont pas des erreurs PostgREST (RLS, contraintes) : pas de `code` PG typique.
 */
export function isTransientSupabaseNetworkError(message: string | undefined): boolean {
  if (!message) return false
  const m = message.toLowerCase()
  return (
    m.includes('fetch failed') ||
    m.includes('econnreset') ||
    m.includes('etimedout') ||
    m.includes('enotfound') ||
    m.includes('socket') ||
    m.includes('network') ||
    m.includes('certificate') ||
    m.includes('ssl') ||
    m.includes('aborted')
  )
}

export function getSupabaseHostnameForLogs(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!raw) return '(NEXT_PUBLIC_SUPABASE_URL manquant)'
  try {
    return new URL(raw.startsWith('http') ? raw : `https://${raw}`).hostname
  } catch {
    return '(URL invalide)'
  }
}

export function isPlaceholderSupabaseUrl(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  return !url || url.includes('placeholder.supabase.co')
}

export function logSupabaseNetworkFailure(context: string, err: { message?: string; code?: string; details?: string } | unknown): void {
  const host = getSupabaseHostnameForLogs()
  if (err instanceof Error) {
    const causeMsg =
      err.cause instanceof Error
        ? err.cause.message
        : err.cause !== undefined
          ? String(err.cause)
          : undefined
    console.error(
      `[${context}] Échec réseau vers Supabase (${host}): ${err.message}` + (causeMsg ? ` | cause: ${causeMsg}` : '')
    )
    console.error(
      `[${context}] Vérifier: URL sans espace parasite, VPN/pare-feu, clé SUPABASE_SERVICE_ROLE_KEY côté serveur, projet Supabase non « en pause », DNS (test: curl -I $NEXT_PUBLIC_SUPABASE_URL/rest/v1/).`
    )
    return
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const e = err as { message?: string; code?: string; details?: string; cause?: unknown }
    const cause =
      e.cause && typeof e.cause === 'object' && e.cause !== null && 'message' in e.cause
        ? String((e.cause as { message?: string }).message)
        : e.cause !== undefined
          ? String(e.cause)
          : undefined
    console.error(
      `[${context}] Échec réseau vers Supabase (${host}): ${e.message ?? err}` +
        (e.code ? ` [code=${e.code}]` : '') +
        (cause ? ` | cause: ${cause}` : '')
    )
    console.error(
      `[${context}] Vérifier: URL sans espace parasite, VPN/pare-feu, clé SUPABASE_SERVICE_ROLE_KEY côté serveur, projet Supabase non « en pause », DNS (test: curl -I $NEXT_PUBLIC_SUPABASE_URL/rest/v1/).`
    )
    return
  }
  console.error(`[${context}] Erreur inattendue vers Supabase (${host}):`, err)
}
