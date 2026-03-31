import { supabaseServer, createSupabaseClient, supabaseService } from './server'
import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import type { Agent, Stack } from './types'
import { anonymizeEmail, anonymizeId } from '@/lib/utils/logger'

// ─── In-memory cache for Clerk ID → Supabase UUID mapping ────────────────────
// Avoids redundant Supabase lookups on every dashboard load
const userIdCache = new Map<string, string>()

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function getInternalUserId(clerkId: string): Promise<string | null> {
  // Check cache first
  if (userIdCache.has(clerkId)) {
    return userIdCache.get(clerkId)!
  }

  const { data, error } = await supabaseServer
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()

  if (error || !data) {
    console.warn(`User not found in 'users' table for Clerk ID: ${anonymizeId(clerkId)}`)
    return null
  }

  const id = (data as any).id
  userIdCache.set(clerkId, id) // Cache for subsequent requests
  return id
}

async function ensureUserExists(clerkId: string, email?: string): Promise<string | null> {
  // Check cache first — skip DB lookup entirely if we've seen this user
  if (userIdCache.has(clerkId)) {
    return userIdCache.get(clerkId)!
  }

  let userId = await getInternalUserId(clerkId)
  
  if (!userId) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing - cannot auto-create users')
      return null
    }
    
    const userData: any = { clerk_id: clerkId, plan: 'free' }
    if (email) {
      userData.email = email
      console.log(`[ensureUserExists] Creating user with email: ${anonymizeEmail(email)}`)
    } else {
      console.warn(`[ensureUserExists] Creating user WITHOUT email for: ${anonymizeId(clerkId)}`)
    }
    
    const { data, error } = await (supabaseService as any)
      .from('users')
      .insert(userData)
      .select('id')
      .single()
    
    if (!error && data) {
      userId = data.id
      userIdCache.set(clerkId, userId!) // Cache the new user
      console.log(`✅ Auto-created user for Clerk ID: ${anonymizeId(clerkId)}`)
    } else {
      console.error(`❌ Failed to create user for Clerk ID: ${anonymizeId(clerkId)}`)
      console.error('   Supabase error:', JSON.stringify(error, null, 2))
      return null
    }
  }
  
  return userId
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

export const getAgentsByCategories = unstable_cache(
  async (categories: string[]): Promise<Agent[]> => {
    if (categories.length === 0) return getAllAgents()
    const { data, error } = await supabaseServer
      .from('agents')
      .select('*')
      .in('category', categories)
      .order('score', { ascending: false })
    if (error) { console.error('getAgentsByCategories error:', error.message); return [] }
    return data ?? []
  },
  ['agents-by-categories'],
  { revalidate: 300 }
)

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

export async function getUserStacks(userId: string, clerkToken: string, email?: string): Promise<Stack[]> {
  const internalId = await ensureUserExists(userId, email)
  
  if (!internalId) {
    return []
  }

  // Use service role to bypass JWT issues
  const { data, error } = await (supabaseService as any)
    .from('stacks')
    .select('*')
    .eq('user_id', internalId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`getUserStacks error (${error.code}): ${error.message}`)
    return []
  }
  return data ?? []
}

export async function saveStack(stack: {
  user_id: string
  name: string
  objective: string
  agent_ids: string[]
  total_cost: number
  roi_estimate: number
  score: number
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
