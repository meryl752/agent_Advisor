import { supabaseService } from '@/lib/supabase/server'

export type UserPlan = 'free' | 'pro' | 'agency'

// ─── In-memory cache ──────────────────────────────────────────────────────────
// Avoids a DB query on every API request for the same user.
// TTL: 5 minutes — short enough to reflect plan upgrades quickly.

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface CacheEntry {
  plan: UserPlan
  expiresAt: number
}

const planCache = new Map<string, CacheEntry>()

function getCached(clerkUserId: string): UserPlan | null {
  const entry = planCache.get(clerkUserId)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    planCache.delete(clerkUserId)
    return null
  }
  return entry.plan
}

function setCached(clerkUserId: string, plan: UserPlan): void {
  planCache.set(clerkUserId, {
    plan,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function getUserPlanFromSupabase(clerkUserId: string): Promise<UserPlan> {
  // Return cached value if still valid
  const cached = getCached(clerkUserId)
  if (cached) return cached

  try {
    const { data, error } = await supabaseService
      .from('users')
      .select('plan')
      .eq('clerk_id', clerkUserId)
      .single<{ plan: UserPlan }>()

    if (error || !data) {
      console.warn(`[getUserPlan] Plan introuvable pour ${clerkUserId.substring(0, 8)}***: ${error?.message ?? 'User not found'}`)
      return 'free'
    }

    const plan = data.plan
    const validPlan: UserPlan = ['free', 'pro', 'agency'].includes(plan) ? plan : 'free'

    setCached(clerkUserId, validPlan)
    return validPlan
  } catch (err) {
    console.error(`[getUserPlan] Erreur pour ${clerkUserId.substring(0, 8)}***:`, err instanceof Error ? err.message : 'Unknown')
    return 'free'
  }
}

/**
 * Invalidate cached plan for a user — call this after a plan upgrade/downgrade.
 * Used by the Stripe webhook after a successful payment.
 */
export function invalidatePlanCache(clerkUserId: string): void {
  planCache.delete(clerkUserId)
  console.log(`[getUserPlan] Cache invalidé pour ${clerkUserId.substring(0, 8)}***`)
}
