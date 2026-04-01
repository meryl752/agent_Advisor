import type { Agent } from '@/lib/supabase/types'
import type { UserContext, FinalStack } from './types'
import { analyzeQuery } from './queryAnalyzer'
import { matchAgents } from './matcher'
import { buildStack } from './stackBuilder'
import { getReferenceStack, getAgentsByCategories } from '@/lib/supabase/queries'

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
  ctx: UserContext
): Promise<OrchestratorResult | null> {
  const startTime = Date.now()
  
  // Global timeout for entire orchestration (2 minutes max)
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => {
      console.error('❌ [Orchestrator] Global timeout after 120s')
      resolve(null)
    }, 120000)
  })

  const orchestrationPromise = (async () => {
    try {
      // ── Agent 1 : Query Analyzer ──────────────────────────────────────────────
      const analyzedQuery = await analyzeQuery(ctx)

      // ── Fetch Reference Stacks — ancrage "vérité terrain" ─────────────────────
      const referenceStacks = await getReferenceStack(
        analyzedQuery.required_categories[0] ?? '',
        analyzedQuery.sector_context ?? ''
      )

      // ── Agent 2 : Matcher (synchrone — fetch agents) ──────────────────────────
      const relevantAgents = await getAgentsByCategories(analyzedQuery.required_categories)
      const candidates = matchAgents(relevantAgents, analyzedQuery, ctx)

      if (candidates.length === 0) {
        console.error('❌ [Agent 2] No candidates')
        return null
      }

    const stack = await buildStack(ctx, analyzedQuery, candidates, referenceStacks)

      if (!stack) {
        console.error('❌ [Agent 3] Stack build failed')
        return null
      }

      // Inject accurate website domains from database for logos
      stack.agents = stack.agents.map(agent => {
        const dbAgent = relevantAgents.find(a => String(a.id) === String(agent.id))
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

      return {
        stack,
        meta: {
          agents_analyzed: relevantAgents.length,
          agents_shortlisted: candidates.length,
          subtasks_detected: analyzedQuery.subtasks.length,
          processing_time_ms: processingTime,
        },
      }
    } catch (err) {
      console.error('❌ [Orchestrator] Error:', err instanceof Error ? err.message : 'Unknown')
      return null
    }
  })()

  return Promise.race([orchestrationPromise, timeoutPromise])
}