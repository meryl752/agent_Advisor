import { NextRequest, NextResponse } from 'next/server'
import { currentUser, auth } from '@clerk/nextjs/server'
import { saveStack } from '@/lib/supabase/queries'
import { updateStacksSummary, saveConversation } from '@/lib/supabase/memory'
import { runOrchestrator } from '@/lib/agents/orchestrator'
import { recommendSchema } from '@/lib/validators/api'
import { captureError, setSentryUser } from '@/lib/monitoring/sentry'
import { assertEnv } from '@/lib/utils/env'

// Fail fast if critical env vars are missing
assertEnv(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])

async function recommendHandler(req: NextRequest) {
  try {
    const user = await currentUser()
    const { getToken } = await auth()
    const token = await getToken({ template: 'supabase' })

    if (!user || !token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    setSentryUser(user.id)

    const body = await req.json()
    const validation = recommendSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      console.error('[recommend] Validation failed:', JSON.stringify(errors))
      console.error('[recommend] Body received:', JSON.stringify(body))
      return NextResponse.json({ error: 'Validation échouée', details: errors }, { status: 400 })
    }

    const { objective, sector, budget, tech_level, team_size, timeline, current_tools, session_id: sessionId } = validation.data

    const userContext = {
      objective,
      sector,
      team_size,
      budget,
      tech_level,
      timeline,
      current_tools: current_tools ?? [],
    }

    let result
    try {
      result = await runOrchestrator(userContext)
    } catch (orchestratorErr) {
      // Orchestrator failed
      captureError(orchestratorErr, { endpoint: '/api/recommend', action: 'orchestrator_failure' })
      console.error('Orchestrator error:', orchestratorErr)
      return NextResponse.json({ error: 'Recommandation impossible' }, { status: 500 })
    }

    if (!result) {
      // No result
      return NextResponse.json({ error: 'Recommandation impossible' }, { status: 500 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    const savedStack = await saveStack({
      user_id: user.id,
      name: result.stack.stack_name,
      objective,
      agent_ids: result.stack.agents.map(a => a.id),
      total_cost: result.stack.total_cost,
      roi_estimate: result.stack.roi_estimate,
      score: Math.round(
        result.stack.agents.reduce((acc, a) => acc + a.score, 0) / result.stack.agents.length
      ),
    }, token, userEmail)

    // Update user memory with new stack — non-blocking
    updateStacksSummary(user.id, {
      name: result.stack.stack_name,
      objective,
      agents: result.stack.agents.map(a => a.name),
      cost: result.stack.total_cost,
    }).catch(err => console.warn('[memory] updateStacksSummary error:', err))

    // Link stack to conversation if session_id provided
    if (sessionId && savedStack?.id) {
      try {
        const { linkStackToConversation } = await import('@/lib/supabase/memory')
        const result = await linkStackToConversation(sessionId, savedStack.id)
        
        if (result.success) {
          console.log('[memory] stack linked to conversation:', sessionId, savedStack.id)
        } else {
          console.error('[memory] failed to link stack:', result.error)
        }
      } catch (err) {
        console.error('[memory] link stack to conversation exception:', err)
      }
    }

    return NextResponse.json({ success: true, result: result.stack, stackId: savedStack?.id, meta: result.meta })
  } catch (err) {
    captureError(err, { endpoint: '/api/recommend', action: 'generate_recommendation' })
    console.error('Recommend API error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Rate limiting: DISABLED
// All users can create unlimited stacks during early access
export const POST = recommendHandler
