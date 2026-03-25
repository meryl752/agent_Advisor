import type { Agent } from '@/lib/supabase/types'
import type { UserContext, FinalStack } from './types'
import { analyzeQuery } from './queryAnalyzer'
import { matchAgents } from './matcher'
import { buildStack } from './stackBuilder'

export interface OrchestratorResult {
    stack: FinalStack
    meta: {
        agents_analyzed: number
        agents_shortlisted: number
        subtasks_detected: number
        processing_time_ms: number
    }
}

export async function runOrchestrator(
  ctx: UserContext,
  allAgents: Agent[]
): Promise<OrchestratorResult | null> {
  const startTime = Date.now()
  console.log('🎯 [Orchestrator] Starting pipeline for:', ctx.objective)

  // ── Agent 1 : Query Analyzer ──────────────────────────────────────────────
  console.log('🔍 [Agent 1] Analyzing query...')
  const analyzedQuery = await analyzeQuery(ctx)
  console.log('✅ [Agent 1] Subtasks:', analyzedQuery.subtasks.length, '| Categories:', analyzedQuery.required_categories)

  // ── Agent 2 : Matcher (synchrone — pas de LLM) ────────────────────────────
  console.log('🎯 [Agent 2] Matching agents...')
  const candidates = matchAgents(allAgents, analyzedQuery, ctx)
  console.log(`✅ [Agent 2] ${candidates.length} candidates from ${allAgents.length}`)

  if (candidates.length === 0) {
    console.error('❌ [Agent 2] No candidates — check DB and budget filter')
    return null
  }

  // ── Agent 3 : Stack Builder ───────────────────────────────────────────────
  console.log('🏗️ [Agent 3] Building stack...')
  const stack = await buildStack(ctx, analyzedQuery, candidates)

  if (!stack) {
    console.error('❌ [Agent 3] Stack build failed')
    return null
  }

  // Inject accurate website domains from database for logos (Gemini hallucinates them or leaves them empty)
  stack.agents = stack.agents.map(agent => {
    const dbAgent = allAgents.find(a => String(a.id) === String(agent.id))
    if (dbAgent && dbAgent.url) {
      let domain = agent.website_domain || ''
      try {
        let urlStr = dbAgent.url
        if (!urlStr.startsWith('http')) urlStr = 'https://' + urlStr
        domain = new URL(urlStr).hostname.replace('www.', '')
      } catch (e) {}
      return { ...agent, website_domain: domain }
    }
    return agent
  })

  const processingTime = Date.now() - startTime
  console.log(`✅ [Agent 3] "${stack.stack_name}" | ${stack.agents.length} agents | ${stack.total_cost}€/mois`)
  console.log(`⚡ [Orchestrator] Done in ${processingTime}ms`)

  return {
    stack,
    meta: {
      agents_analyzed: allAgents.length,
      agents_shortlisted: candidates.length,
      subtasks_detected: analyzedQuery.subtasks.length,
      processing_time_ms: processingTime,
    },
  }
}