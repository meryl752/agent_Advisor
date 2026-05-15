import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { buildGuides } from '@/lib/agents/guideBuilder'
import { enforceLlmAbuseLimit } from '@/lib/rate-limit/enforceLlmAbuse'
import type { StackAgent, UserContext } from '@/lib/agents/types'

/**
 * POST /api/guides
 * Called after /api/recommend returns — generates step-by-step guides
 * for each agent asynchronously, without blocking the main recommendation.
 *
 * Returns a streaming response: one JSON line per agent as it completes.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const abuseResponse = await enforceLlmAbuseLimit(userId, 'guides')
  if (abuseResponse) return abuseResponse

  const body = await req.json().catch(() => null)
  if (!body?.agents || !body?.ctx) {
    return NextResponse.json({ error: 'agents et ctx requis' }, { status: 400 })
  }

  const agents: StackAgent[] = body.agents
  const ctx: Pick<UserContext, 'objective' | 'tech_level'> = body.ctx

  // Stream response — send each agent's guide as it's ready
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Ne pas lancer un LLM par agent en parallèle (saturation Groq/Cerebras → 429 / timeouts).
        // buildGuides limite déjà à 2 appels LLM en parallèle : on traite par paquets et on stream chaque lot.
        const BATCH = 2
        for (let i = 0; i < agents.length; i += BATCH) {
          const slice = agents.slice(i, i + BATCH)
          const enriched = await buildGuides(slice, ctx as UserContext)
          for (let j = 0; j < enriched.length; j++) {
            const idx = i + j
            const line = JSON.stringify({ idx, agent: enriched[j] }) + '\n'
            controller.enqueue(encoder.encode(line))
          }
        }
      } catch (err) {
        console.error('[/api/guides] Error:', err)
      } finally {
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
