import { NextRequest, NextResponse } from 'next/server'
import { currentUser, auth } from '@clerk/nextjs/server'
import { getAllAgents, saveStack } from '@/lib/supabase/queries'
import { runOrchestrator } from '@/lib/agents/orchestrator'

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    const { getToken } = await auth()
    const token = await getToken({ template: 'supabase' })

    if (!user || !token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { objective } = await req.json()
    if (!objective?.trim()) {
      return NextResponse.json({ error: 'Objectif requis' }, { status: 400 })
    }

    const agents = await getAllAgents()
    if (agents.length === 0) {
      return NextResponse.json({ error: 'Base agents vide' }, { status: 500 })
    }

    // Le backend construit un UserContext complet pour respecter le type
    const userContext = {
      objective,
      sector: 'général',
      team_size: 'solo' as const,
      budget: 'medium' as const,
      tech_level: 'intermediate' as const,
      timeline: 'weeks' as const,
      current_tools: [],
    }

    const result = await runOrchestrator(userContext, agents)
    if (!result) {
      return NextResponse.json({ error: 'Recommandation impossible' }, { status: 500 })
    }

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
    }, token)

    return NextResponse.json({ success: true, result: result.stack, meta: result.meta })
  } catch (err) {
    console.error('Recommend API error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}