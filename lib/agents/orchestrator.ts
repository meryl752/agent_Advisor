import type { UserContext, VectorAgent } from './types'
import type { Agent } from '@/lib/supabase/types'
import { analyzeQuery } from './queryAnalyzer'
import { matchAgents } from './matcher'
import { buildStack } from './stackBuilder'
import { getReferenceStack, getVectorMatchedAgents, getAgentsByCategories } from '@/lib/supabase/queries'
import { BUDGET_MAP } from '@/lib/constants'
import type { FinalStack } from './types'

export interface OrchestratorResult {
  stack: FinalStack
  meta: {
    agents_analyzed: number
    agents_shortlisted: number
    subtasks_detected: number
    processing_time_ms: number
    retrieval_mode: 'vector' | 'fallback'
  }
}

// ─── Embedding via Hugging Face Inference API ─────────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) throw new Error('[Embedding] HUGGINGFACE_API_KEY manquant')

  const res = await fetch(
    'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        options: { wait_for_model: true },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`[Embedding] HuggingFace error ${res.status}: ${err}`)
  }

  const data = await res.json()

  if (!Array.isArray(data)) throw new Error('[Embedding] Format inattendu')

  let vector: number[]
  if (typeof data[0] === 'number') {
    vector = data as number[]
  } else if (Array.isArray(data[0]) && typeof data[0][0] === 'number') {
    vector = data[0] as number[]
  } else if (Array.isArray(data[0]) && Array.isArray(data[0][0])) {
    // Token embeddings — mean pool
    const tokens = data[0] as number[][]
    const dim = tokens[0].length
    vector = new Array(dim).fill(0)
    for (const t of tokens) for (let i = 0; i < dim; i++) vector[i] += t[i]
    vector = vector.map(v => v / tokens.length)
  } else {
    throw new Error('[Embedding] Format de réponse non reconnu')
  }

  console.log(`[Embedding] ✅ ${vector.length} dimensions`)
  return vector
}

// ─── Fallback matcher — adapts DB agents to VectorAgent with similarity=1 ────
// Used when vector search is unavailable. Assigns similarity=1 so the
// business scoring (30%) and context scoring (20%) still drive the result.

function adaptToVectorAgents(agents: Agent[]): VectorAgent[] {
  return agents.map(a => ({
    ...(a as any),
    similarity: 1, // neutral — business + context scoring takes over
    best_for: (a as any).best_for ?? [],
    integrations: (a as any).integrations ?? [],
  })) as VectorAgent[]
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────

export async function runOrchestrator(
  ctx: UserContext
): Promise<OrchestratorResult | null> {
  const startTime = Date.now()

  const timeoutPromise = new Promise<null>(resolve =>
    setTimeout(() => {
      console.error('❌ [Orchestrator] Timeout après 50s')
      resolve(null)
    }, 50_000)
  )

  const orchestrationPromise = (async (): Promise<OrchestratorResult | null> => {
    try {
      // ── Étape 1 : Analyse de la requête ────────────────────────────────────
      console.log('[Orchestrator] Étape 1 — Analyse...')
      const analyzedQuery = await analyzeQuery(ctx)
      console.log(`[Orchestrator] ✅ ${analyzedQuery.subtasks.length} sous-tâches | catégories: [${analyzedQuery.required_categories.join(', ')}]`)

      const budgetMax = BUDGET_MAP[ctx.budget] ?? 0
      const primaryCategory = analyzedQuery.required_categories[0] ?? null

      // ── Étape 2 : Récupération des agents (vectorielle ou fallback) ─────────
      let vectorAgents: VectorAgent[] = []
      let retrievalMode: 'vector' | 'fallback' = 'fallback'

      // Fetch reference stacks in parallel regardless of retrieval mode
      const referenceStacksPromise = getReferenceStack(
        analyzedQuery.required_categories[0] ?? '',
        analyzedQuery.sector_context ?? ''
      )

      try {
        console.log('[Orchestrator] Étape 2 — Génération de l\'embedding...')
        const embeddingText = [
          ctx.objective,
          analyzedQuery.sector_context ?? '',
          analyzedQuery.subtasks.slice(0, 3).join('. '),
        ].join('. ')

        const embedding = await generateEmbedding(embeddingText)

        console.log('[Orchestrator] Étape 3 — Recherche vectorielle Supabase...')
        const rawVectorAgents = await getVectorMatchedAgents(
          embedding,
          budgetMax,
          primaryCategory ?? undefined
        )

        if (rawVectorAgents && rawVectorAgents.length > 0) {
          vectorAgents = rawVectorAgents as VectorAgent[]
          retrievalMode = 'vector'
          console.log(`[Orchestrator] ✅ Mode vectoriel — ${vectorAgents.length} agents`)
        } else {
          throw new Error('Aucun agent retourné par le RPC vectoriel')
        }
      } catch (vectorErr) {
        // ── Fallback : recherche classique par catégories ───────────────────
        console.warn(`[Orchestrator] ⚠️ Fallback mode — raison: ${vectorErr instanceof Error ? vectorErr.message : String(vectorErr)}`)
        const dbAgents = await getAgentsByCategories(analyzedQuery.required_categories)
        vectorAgents = adaptToVectorAgents(dbAgents)
        retrievalMode = 'fallback'
        console.log(`[Orchestrator] ✅ Mode fallback — ${vectorAgents.length} agents depuis DB`)
      }

      if (vectorAgents.length === 0) {
        console.error('❌ [Orchestrator] Aucun agent disponible')
        return null
      }

      // ── Étape 4 : Scoring hybride ───────────────────────────────────────────
      console.log('[Orchestrator] Étape 4 — Scoring...')
      const candidates = matchAgents(vectorAgents, analyzedQuery, ctx)

      if (candidates.length === 0) {
        console.error('❌ [Orchestrator] Aucun candidat après scoring')
        return null
      }

      console.log(`[Orchestrator] ✅ Top candidat: ${candidates[0].name} (${candidates[0].relevance_score}/100)`)

      // ── Étape 5 : Construction du stack ────────────────────────────────────
      console.log('[Orchestrator] Étape 5 — Construction du stack...')
      const referenceStacks = await referenceStacksPromise
      const top5 = candidates.slice(0, 5)
      const stack = await buildStack(ctx, analyzedQuery, top5, referenceStacks)

      if (!stack) {
        console.error('❌ [Orchestrator] Échec construction stack')
        return null
      }

      console.log(`[Orchestrator] ✅ "${stack.stack_name}" — ${stack.agents.length} agents, ${stack.total_cost}€/mois`)

      // Inject website domains
      stack.agents = stack.agents.map(agent => {
        const source = vectorAgents.find(a => String(a.id) === String(agent.id))
        if (source?.website_domain) return { ...agent, website_domain: source.website_domain }
        return agent
      })

      const processingTime = Date.now() - startTime
      console.log(`[Orchestrator] ✅ Pipeline complet en ${processingTime}ms (mode: ${retrievalMode})`)

      return {
        stack,
        meta: {
          agents_analyzed:    vectorAgents.length,
          agents_shortlisted: candidates.length,
          subtasks_detected:  analyzedQuery.subtasks.length,
          processing_time_ms: processingTime,
          retrieval_mode:     retrievalMode,
        },
      }
    } catch (err) {
      console.error('❌ [Orchestrator] Erreur fatale:', err instanceof Error ? err.message : String(err))
      return null
    }
  })()

  return Promise.race([orchestrationPromise, timeoutPromise])
}
