import { supabaseServer, createSupabaseClient, supabaseService } from './server'
import { createClient } from '@supabase/supabase-js'
import type { Agent, Stack } from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function getInternalUserId(clerkId: string): Promise<string | null> {
  const { data, error } = await supabaseServer
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()

  if (error || !data) {
    console.warn(`User not found in 'users' table for Clerk ID: ${clerkId}`)
    return null
  }
  return (data as any).id
}

async function ensureUserExists(clerkId: string, email?: string): Promise<string | null> {
  // Try to get existing user
  let userId = await getInternalUserId(clerkId)
  
  console.log(`[ensureUserExists] Checking user: ${clerkId}, found: ${userId ? 'YES' : 'NO'}`)
  
  if (!userId) {
    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing - cannot auto-create users')
      console.error('   Add it to .env.local from Supabase Dashboard → Settings → API → service_role key')
      return null
    }
    
    // Auto-create user if not exists
    const userData: any = { clerk_id: clerkId, plan: 'free' }
    if (email) {
      userData.email = email
      console.log(`[ensureUserExists] Creating user with email: ${email}`)
    } else {
      console.warn(`[ensureUserExists] Creating user WITHOUT email for: ${clerkId}`)
    }
    
    const { data, error } = await (supabaseService as any)
      .from('users')
      .insert(userData)
      .select('id')
      .single()
    
    if (!error && data) {
      userId = data.id
      console.log(`✅ Auto-created user for Clerk ID: ${clerkId} → UUID: ${userId}`)
    } else {
      console.error(`❌ Failed to create user for Clerk ID: ${clerkId}`)
      console.error('   Supabase error:', JSON.stringify(error, null, 2))
      return null
    }
  }
  
  console.log(`[ensureUserExists] Returning UUID: ${userId}`)
  return userId
}

// ─── Agents ──────────────────────────────────────────────────────────────────

export async function getAllAgents(): Promise<Agent[]> {
  const { data, error } = await supabaseServer
    .from('agents')
    .select('*')
    .order('score', { ascending: false })

  if (error) { console.error('getAllAgents error:', JSON.stringify(error, null, 2)); return [] }
  return data ?? []
}

export async function getAgentsByCategories(categories: string[]): Promise<Agent[]> {
  if (categories.length === 0) return getAllAgents()

  const { data, error } = await supabaseServer
    .from('agents')
    .select('*')
    .in('category', categories)
    .order('score', { ascending: false })

  if (error) { console.error('getAgentsByCategories error:', JSON.stringify(error, null, 2)); return [] }
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

export async function getTopAgents(limit = 10): Promise<Agent[]> {
  const { data, error } = await supabaseServer
    .from('agents')
    .select('*')
    .order('roi_score', { ascending: false })
    .limit(limit)

  if (error) { console.error('getTopAgents error:', JSON.stringify(error, null, 2)); return [] }
  return data ?? []
}

// ─── Stacks ──────────────────────────────────────────────────────────────────

export async function getUserStacks(userId: string, clerkToken: string, email?: string): Promise<Stack[]> {
  // Mapping Clerk ID -> Supabase Internal UUID (with auto-creation)
  const internalId = await ensureUserExists(userId, email)
  
  console.log(`[getUserStacks] Clerk ID: ${userId} → Internal UUID: ${internalId}`)
  
  if (!internalId) {
    console.error(`Cannot get stacks: User creation failed for Clerk ID: ${userId}`)
    return []
  }

  // Use service role to bypass JWT issues
  const { data, error} = await (supabaseService as any)
    .from('stacks')
    .select('*')
    .eq('user_id', internalId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`getUserStacks error (${error.code}): ${error.message}`)
    console.error(`   Attempted to query with user_id: ${internalId}`)
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
    console.error(`Cannot save stack: User creation failed for Clerk ID: ${stack.user_id}`)
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
