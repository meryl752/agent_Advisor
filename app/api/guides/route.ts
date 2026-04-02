import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { buildGuides } from '@/lib/agents/guideBuilder'
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
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

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
        // Process agents in parallel but emit results as they arrive
        const promises = agents.map(async (agent, idx) => {
          const enriched = await buildGuides([agent], ctx as UserContext)
          const line = JSON.stringify({ idx, agent: enriched[0] }) + '\n'
          controller.enqueue(encoder.encode(line))
        })
        await Promise.allSettled(promises)
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
