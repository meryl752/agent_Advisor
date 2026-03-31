import { NextRequest, NextResponse } from 'next/server'
import { currentUser, auth } from '@clerk/nextjs/server'
import { saveStack } from '@/lib/supabase/queries'
import { runOrchestrator } from '@/lib/agents/orchestrator'
import { recommendSchema } from '@/lib/validators/api'
import { getRateLimiter, withRateLimit } from '@/lib/rate-limit'
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

    // Set Sentry user context (anonymized)
    setSentryUser(user.id)

    const body = await req.json()
    const validation = recommendSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return NextResponse.json({ error: 'Validation échouée', details: errors }, { status: 400 })
    }

    const { objective, sector, budget, tech_level, team_size, timeline, current_tools } = validation.data

    const userContext = {
      objective,
      sector,
      team_size,
      budget,
      tech_level,
      timeline,
      current_tools: current_tools ?? [],
    }

    const result = await runOrchestrator(userContext)
    if (!result) {
      return NextResponse.json({ error: 'Recommandation impossible' }, { status: 500 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    await saveStack({
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

    return NextResponse.json({ success: true, result: result.stack, meta: result.meta })
  } catch (err) {
    captureError(err, { endpoint: '/api/recommend', action: 'generate_recommendation' })
    console.error('Recommend API error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Apply rate limiting middleware
const rateLimiter = getRateLimiter()

export const POST = rateLimiter
  ? withRateLimit(recommendHandler, { limiter: rateLimiter, endpoint: 'recommend' })
  : recommendHandler