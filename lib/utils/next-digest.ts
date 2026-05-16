import type { Stack } from '@/lib/supabase/types'

/** Valeur booléenne fiable pour `digest_enabled` (PostgREST / sérialisation parfois atypique). */
export function coerceDigestEnabled(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (value === false || value === 0 || value == null) return false
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase()
    return s === 'true' || s === 't' || s === '1'
  }
  return false
}

function coerceDigestEnabledAt(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value
  return null
}

/** Normalise les champs digest sur une ligne `stacks` lue depuis Supabase. */
export function normalizeStackDigestRow(row: Stack): Stack {
  return {
    ...row,
    digest_enabled: coerceDigestEnabled((row as { digest_enabled?: unknown }).digest_enabled),
    digest_enabled_at: coerceDigestEnabledAt(
      (row as { digest_enabled_at?: unknown }).digest_enabled_at
    ),
  }
}

/** Prochain créneau digest : une fois par semaine à partir de `digest_enabled_at`. */
export function getNextDigestDate(enabledAtIso: string | null): Date | null {
  if (!enabledAtIso) return null
  const anchor = new Date(enabledAtIso)
  if (Number.isNaN(anchor.getTime())) return null
  const weekMs = 7 * 24 * 60 * 60 * 1000
  let t = anchor.getTime()
  const now = Date.now()
  while (t <= now) {
    t += weekMs
  }
  return new Date(t)
}

export function formatDigestDate(d: Date, locale = 'en-US') {
  return d.toLocaleString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
