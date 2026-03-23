import { supabaseServer } from './server'
import type { Agent, Stack } from './types'

// ─── Agents ──────────────────────────────────────────────────────────────────

export async function getAllAgents(): Promise<Agent[]> {
  const { data, error } = await supabaseServer
    .from('agents')
    .select('*')
    .order('score', { ascending: false })

  if (error) { console.error('getAllAgents error:', error); return [] }
  return data ?? []
}

export async function getAgentsByCategory(category: string): Promise<Agent[]> {
  const { data, error } = await supabaseServer
    .from('agents')
    .select('*')
    .eq('category', category)
    .order('score', { ascending: false })

  if (error) { console.error('getAgentsByCategory error:', error); return [] }
  return data ?? []
}

export async function searchAgents(query: string): Promise<Agent[]> {
  const { data, error } = await supabaseServer
    .from('agents')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('score', { ascending: false })
    .limit(20)

  if (error) { console.error('searchAgents error:', error); return [] }
  return data ?? []
}

export async function getTopAgents(limit = 10): Promise<Agent[]> {
  const { data, error } = await supabaseServer
    .from('agents')
    .select('*')
    .order('roi_score', { ascending: false })
    .limit(limit)

  if (error) { console.error('getTopAgents error:', error); return [] }
  return data ?? []
}

// ─── Stacks ──────────────────────────────────────────────────────────────────

export async function getUserStacks(userId: string): Promise<Stack[]> {
  const { data, error } = await supabaseServer
    .from('stacks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) { console.error('getUserStacks error:', error); return [] }
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
}): Promise<Stack | null> {
  const { data, error } = await supabaseServer
    .from('stacks')
    .insert(stack)
    .select()
    .single()

  if (error) { console.error('saveStack error:', error); return null }
  return data
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(clerkId: string, email: string) {
  const { data, error } = await supabaseServer
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
  const { error } = await supabaseServer
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
