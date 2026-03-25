import { supabaseServer, createSupabaseClient } from './server'
import { createClient } from '@supabase/supabase-js'
import type { Agent, Stack } from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function getInternalUserId(clerkId: string): Promise<string | null> {
  const { data, error } = await supabaseServer
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()

  if (error || !data) return null
  return (data as any).id
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

export async function getAgentsByCategory(category: string): Promise<Agent[]> {
  const { data, error } = await supabaseServer
    .from('agents')
    .select('*')
    .eq('category', category)
    .order('score', { ascending: false })

  if (error) { console.error('getAgentsByCategory error:', JSON.stringify(error, null, 2)); return [] }
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

export async function getUserStacks(userId: string, clerkToken: string): Promise<Stack[]> {
  const db = createSupabaseClient(clerkToken)

  // Mapping Clerk ID -> Supabase Internal UUID
  const internalId = await getInternalUserId(userId)
  if (!internalId) {
    console.warn(`User not found in 'users' table for Clerk ID: ${userId}`)
    return []
  }

  const { data, error } = await db
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
}, clerkToken: string): Promise<Stack | null> {
  const db = createSupabaseClient(clerkToken)

  // Mapping Clerk ID -> Supabase Internal UUID
  const internalId = await getInternalUserId(stack.user_id)
  if (!internalId) {
    console.error(`Cannot save stack: User not found for Clerk ID: ${stack.user_id}`)
    return null
  }

  const { data, error } = await (db as any)
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

export async function getUserByClerkId(clerkId: string) {
  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single()

  if (error) { return null }
  return data
}

// ─── Waitlist ─────────────────────────────────────────────────────────────────

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
