import { supabaseService } from '@/lib/supabase/server'
import type { Stack } from '@/lib/supabase/types'

export type StackAgentRow = {
  id: string
  name: string
  category: string
  price_from: number
  score: number
  roi_score: number
  integrations?: string[] | null
}

export async function fetchAgentsForStack(agentIds: string[]): Promise<StackAgentRow[]> {
  if (!agentIds.length) return []

  const { data, error } = await (supabaseService as any)
    .from('agents')
    .select('id, name, category, price_from, score, roi_score, integrations')
    .in('id', agentIds)

  if (error) {
    console.error('[fetchAgentsForStack]', error.message)
    return []
  }

  const byId = new Map((data ?? []).map((a: StackAgentRow) => [a.id, a]))
  return agentIds.map((id) => byId.get(id)).filter(Boolean) as StackAgentRow[]
}

export function computeLiveStackMetrics(agents: StackAgentRow[]) {
  if (agents.length === 0) {
    return { total_cost: 0, roi_estimate: 0, tool_count: 0 }
  }

  const total_cost = agents.reduce((s, a) => s + (a.price_from ?? 0), 0)
  const roi_estimate = Math.round(
    agents.reduce((s, a) => s + (a.roi_score ?? 50), 0) / agents.length
  )

  return { total_cost, roi_estimate, tool_count: agents.length }
}

export async function enrichStackWithLiveMetrics(stack: Stack) {
  const agents = await fetchAgentsForStack(stack.agent_ids ?? [])
  const live = computeLiveStackMetrics(agents)
  return {
    stack,
    agents,
    total_cost: live.total_cost,
    roi_estimate: live.roi_estimate,
    tool_count: live.tool_count,
  }
}
