import { supabaseServer, createSupabaseClient, supabaseService } from './server'
import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import type { Agent, Stack, StackUpdateEvent } from './types'
import { anonymizeEmail, anonymizeId } from '@/lib/utils/logger'
import {
  getSupabaseHostnameForLogs,
  isPlaceholderSupabaseUrl,
  isTransientSupabaseNetworkError,
  logSupabaseNetworkFailure,
} from '@/lib/supabase/network'
import { normalizeStackDigestRow } from '@/lib/utils/next-digest'
import { resolveSessionLocale, type AppLocale } from '@/lib/i18n/locale'

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Note: no in-memory cache here — serverless functions (Vercel) don't share
// memory between invocations, so a Map() cache would be unreliable and could
// serve stale data across concurrent instances. The DB lookup is fast (~5ms)
// on an indexed column and is the correct approach in a serverless context.

async function getInternalUserId(clerkId: string): Promise<string | null> {
  const { data, error } = await supabaseServer
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()

  if (error || !data) {
    console.warn(`User not found in 'users' table for Clerk ID: ${anonymizeId(clerkId)}`)
    return null
  }

  return (data as any).id
}

// Exported for use in API route handlers that need the Clerk → Supabase UUID mapping
export async function getInternalUserIdForRoute(clerkId: string): Promise<string | null> {
  return getInternalUserId(clerkId)
}

async function ensureUserExists(clerkId: string, email?: string): Promise<string | null> {
  let internalId = await getInternalUserId(clerkId)
  if (internalId) return internalId

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing - cannot auto-create users')
    return null
  }

  // Certaines bases exigent email NOT NULL ; OAuth sans email primaire arrive en dev.
  const resolvedEmail =
    email?.trim() || `${clerkId.replace(/[^a-zA-Z0-9_-]/g, '_')}@users.noreply.internal`

  const { data, error } = await (supabaseService as any)
    .from('users')
    .upsert(
      {
        clerk_id: clerkId,
        email: resolvedEmail,
        plan: 'free',
      },
      { onConflict: 'clerk_id' }
    )
    .select('id')
    .single()

  if (!error && data?.id) {
    console.log(`✅ Ensured user for Clerk ID: ${anonymizeId(clerkId)}`)
    return data.id
  }

  // Course entre requêtes : l’autre insert a gagné
  internalId = await getInternalUserId(clerkId)
  if (internalId) return internalId

  console.error(`❌ Failed to create user for Clerk ID: ${anonymizeId(clerkId)}`)
  console.error('   Supabase error:', error?.message ?? error, error?.code, error?.details)
  return null
}

// ─── Agents ──────────────────────────────────────────────────────────────────
// Cached for 5 minutes — agents data rarely changes

export const getAllAgents = unstable_cache(
  async (): Promise<Agent[]> => {
    const { data, error } = await supabaseServer
      .from('agents')
      .select('*')
      .order('score', { ascending: false })
    if (error) { console.error('getAllAgents error:', error.message); return [] }
    return data ?? []
  },
  ['all-agents'],
  { revalidate: 300 } // 5 minutes
)

export const getAgentsByCategories = async (categories: string[]): Promise<Agent[]> => {
  if (categories.length === 0) return getAllAgents()
  const { data, error } = await supabaseServer
    .from('agents')
    .select('*')
    .in('category', categories)
    .order('score', { ascending: false })
  if (error) { console.error('getAgentsByCategories error:', error.message); return [] }
  return data ?? []
}

export async function searchAgents(query: string): Promise<Agent[]> {
  const { data, error } = await supabaseServer
    .from('agents')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('score', { ascending: false })
    .limit(20)

  if (error) { console.error('searchAgents error:', JSON.stringify(error, null, 2)); return [] }
  return data ?? []
}

export const getTopAgents = unstable_cache(
  async (limit = 10): Promise<Agent[]> => {
    const { data, error } = await supabaseServer
      .from('agents')
      .select('*')
      .order('roi_score', { ascending: false })
      .limit(limit)
    if (error) { console.error('getTopAgents error:', error.message); return [] }
    return data ?? []
  },
  ['top-agents'],
  { revalidate: 300 }
)

// ─── Stacks ──────────────────────────────────────────────────────────────────

export type UserStacksFetchResult = {
  stacks: Stack[]
  /** True si Supabase est injoignable après les tentatives (réseau, DNS, pare-feu, projet en pause…). */
  connectionFailed: boolean
}

function stacksResult(stacks: Stack[], connectionFailed: boolean): UserStacksFetchResult {
  return { stacks, connectionFailed }
}

export async function getUserStacks(
  userId: string,
  clerkToken: string,
  email?: string
): Promise<UserStacksFetchResult> {
  if (isPlaceholderSupabaseUrl()) {
    console.error(
      '[getUserStacks] NEXT_PUBLIC_SUPABASE_URL est absent ou encore "placeholder" — renseigne l’URL du projet dans .env.local.'
    )
    return stacksResult([], false)
  }

  let internalId: string | null = null
  try {
    internalId = await ensureUserExists(userId, email)
  } catch (e) {
    logSupabaseNetworkFailure('getUserStacks/ensureUserExists', e)
    return stacksResult([], true)
  }

  if (!internalId) {
    return stacksResult([], false)
  }

  const delays = [0, 300, 800, 2000]
  const lastIndex = delays.length - 1

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) {
      await new Promise((r) => setTimeout(r, delays[attempt]))
    }
    try {
      const { data, error } = await (supabaseService as any)
        .from('stacks')
        .select('*')
        .eq('user_id', internalId)
        .order('created_at', { ascending: false })

      if (!error) {
        const rows = (data ?? []) as Stack[]
        return stacksResult(rows.map(normalizeStackDigestRow), false)
      }

      const msg = error.message ?? ''
      const transient = isTransientSupabaseNetworkError(msg)
      const canRetry = attempt < lastIndex

      if (transient && canRetry) {
        console.warn(
          `[getUserStacks] tentative ${attempt + 1}/${delays.length} échouée (${getSupabaseHostnameForLogs()}), nouvel essai…`
        )
        continue
      }

      if (transient) {
        logSupabaseNetworkFailure('getUserStacks', error)
        return stacksResult([], true)
      }
      console.error(`getUserStacks error (${error.code ?? 'n/a'}): ${msg}`, error.details ?? '')
      return stacksResult([], false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const transient = isTransientSupabaseNetworkError(msg)
      const canRetry = attempt < lastIndex
      if (transient && canRetry) {
        console.warn(
          `[getUserStacks] exception réseau tentative ${attempt + 1}/${delays.length} (${getSupabaseHostnameForLogs()}), nouvel essai…`
        )
        continue
      }
      if (transient) {
        logSupabaseNetworkFailure('getUserStacks', e instanceof Error ? e : { message: msg })
        return stacksResult([], true)
      }
      console.error('getUserStacks exception (non réseau):', e)
      return stacksResult([], false)
    }
  }

  return stacksResult([], true)
}

/** Événements « Updates » pour un stack (vérifie que le stack appartient à l’utilisateur). */
export async function getStackUpdateEvents(
  stackId: string,
  clerkUserId: string,
  email?: string,
  limit = 30
): Promise<StackUpdateEvent[]> {
  if (isPlaceholderSupabaseUrl()) return []

  const internalId = await ensureUserExists(clerkUserId, email)
  if (!internalId) return []

  const { data: owned, error: ownErr } = await (supabaseService as any)
    .from('stacks')
    .select('id')
    .eq('id', stackId)
    .eq('user_id', internalId)
    .maybeSingle()

  if (ownErr || !owned) return []

  const { data, error } = await (supabaseService as any)
    .from('stack_update_events')
    .select('id, stack_id, type, title, body, meta, read_at, created_at')
    .eq('stack_id', stackId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100))

  if (error) {
    console.error('getStackUpdateEvents:', error.message)
    return []
  }
  return (data ?? []) as StackUpdateEvent[]
}

export async function getConversationLocale(sessionId: string): Promise<AppLocale> {
  const { data } = await (supabaseService as any)
    .from('conversations')
    .select('locale')
    .eq('session_id', sessionId)
    .maybeSingle()

  const loc = data?.locale
  return loc === 'fr' ? 'fr' : 'en'
}

export async function saveStack(stack: {
  user_id: string
  name: string
  objective: string
  agent_ids: string[]
  total_cost: number
  roi_estimate: number
  score: number
  score_breakdown?: Record<string, unknown>
}, clerkToken: string, email?: string): Promise<Stack | null> {
  // Mapping Clerk ID -> Supabase Internal UUID (with auto-creation)
  const internalId = await ensureUserExists(stack.user_id, email)
  if (!internalId) {
    console.error(`Cannot save stack: User creation failed for Clerk ID: ${anonymizeId(stack.user_id)}`)
    return null
  }

  // Use service role to bypass JWT issues
  const { data, error } = await (supabaseService as any)
    .from('stacks')
    .insert({ ...stack, user_id: internalId })
    .select()
    .single()

  if (error) {
    console.error(`saveStack error (${error.code}): ${error.message}`)
    return null
  }
  return data
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(clerkId: string, email: string, clerkToken: string) {
  const db = createSupabaseClient(clerkToken)
  const { data, error } = await (db as any)
    .from('users')
    .upsert({ clerk_id: clerkId, email, plan: 'free' }, { onConflict: 'clerk_id' })
    .select()
    .single()

  if (error) { console.error('upsertUser error:', error); return null }
  return data
}

export async function syncUserWithServiceRole(clerkId: string, email: string, metadata?: any) {
  const { data, error } = await (supabaseService as any)
    .from('users')
    .upsert(
      { clerk_id: clerkId, email, ...metadata }, 
      { onConflict: 'clerk_id' }
    )
    .select()
    .single()

  if (error) { console.error('syncUserWithServiceRole error:', error); return null }
  return data
}

export async function getUserByClerkId(clerkId: string) {
  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single()

  if (error) { return null }
  return data
}

export async function addToWaitlist(email: string): Promise<boolean> {
  const { error } = await (supabaseServer as any)
    .from('waitlist')
    .insert({ email })

  if (error) {
    // Duplicate email — not a real error
    if (error.code === '23505') return true
    console.error('addToWaitlist error:', error)
    return false
  }
  return true
}

// ─── Reference Stacks ────────────────────────────────────────────────────────

export async function getReferenceStack(useCase: string, sector: string) {
  const { data } = await (supabaseServer as any)
    .from('reference_stacks')
    .select('*')
    .or(`use_case.ilike.%${useCase}%,sector.ilike.%${sector}%`)
    .eq('validated', true)
    .order('usage_count', { ascending: false })
    .limit(3)

  return (data ?? []) as Array<{ id: string; title: string; agent_names: string[]; description: string; usage_count: number }>
}

export async function incrementReferenceUsage(id: string) {
  await (supabaseServer as any)
    .from('reference_stacks')
    .update({ usage_count: (supabaseServer as any).rpc('increment', { x: 1 }) })
    .eq('id', id)
}

// ─── Vector Search ────────────────────────────────────────────────────────────

export async function getVectorMatchedAgents(embedding: number[], budget: number, category?: string) {
  // Utilise la fonction RPC smart_search_agents_v2 avec HNSW index
  // match_count=40 pour un meilleur recall (vs 17 par défaut)
  // category=null pour ne pas filtrer par catégorie unique — le Matcher RRF s'en charge
  const { data, error } = await (supabaseService as any).rpc('smart_search_agents_v2', {
    query_embedding: embedding,
    user_budget_max: budget || 0,
    user_category: null,
  })

  if (error) {
    console.error('Erreur recherche vectorielle:', error)
    throw error
  }
  return data
}
