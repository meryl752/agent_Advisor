import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getAllAgents } from '@/lib/supabase/queries'
import { getStackRecommendation, type UserContext } from '@/lib/gemini/recommender'
import { saveStack } from '@/lib/supabase/queries'

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const ctx: UserContext = await req.json()
    if (!ctx.objective?.trim()) return NextResponse.json({ error: 'Objectif requis' }, { status: 400 })

    const agents = await getAllAgents()
    if (agents.length === 0) return NextResponse.json({ error: 'Base agents vide' }, { status: 500 })

    const result = await getStackRecommendation(ctx, agents)
    if (!result) {
      console.error('Recommendation failed — agents:', agents.length, 'ctx:', ctx)
      return NextResponse.json({ error: 'Recommandation impossible' }, { status: 500 })
    }

    await saveStack({
      user_id: user.id,
      name: result.stack_name,
      objective: ctx.objective,
      agent_ids: result.agents.map(a => a.id),
      total_cost: result.total_cost,
      roi_estimate: result.roi_estimate,
      score: Math.round(result.agents.reduce((acc, a) => acc + a.score, 0) / result.agents.length),
    })

    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('Recommend API error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}