// lib/db/agents.ts
// TODO: Supabase integration — replace mock data with real DB queries
//
// Setup steps when ready:
// 1. npm install @supabase/supabase-js
// 2. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
// 3. Uncomment Supabase client and query functions below
// 4. Replace imports of mockAgents in components with these functions

import type { AgentQuery } from '@/lib/types/agent'
import type { Agent } from '@/types'
import { MOCK_AGENTS } from '@/lib/data/mockAgents'

// --- FUTURE SUPABASE CLIENT ---
// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// )

/**
 * Fetch all agents — currently returns mock data.
 * TODO: Replace with Supabase query:
 *   const { data } = await supabase.from('agents').select('*')
 */
export async function getAllAgents(): Promise<Agent[]> {
  return MOCK_AGENTS
}

/**
 * Fetch agents filtered by query params.
 * TODO: Replace with parameterized Supabase query.
 */
export async function getAgentsByQuery(query: AgentQuery): Promise<Agent[]> {
  let results = [...MOCK_AGENTS]

  if (query.category) {
    results = results.filter(a => a.category === query.category)
  }
  if (query.use_case) {
    results = results.filter(a => a.use_cases.includes(query.use_case!))
  }
  if (query.max_price !== undefined) {
    results = results.filter(a => (a.price_from ?? 0) <= query.max_price!)
  }
  if (query.min_score !== undefined) {
    results = results.filter(a => a.score >= query.min_score!)
  }
  if (query.limit) {
    results = results.slice(0, query.limit)
  }

  return results.sort((a, b) => b.score - a.score)
}

/**
 * Fetch a single agent by ID.
 * TODO: Replace with: await supabase.from('agents').select('*').eq('id', id).single()
 */
export async function getAgentById(id: string): Promise<Agent | null> {
  return MOCK_AGENTS.find(a => a.id === id) ?? null
}
